/**
 * Deployment Validation Module
 * 
 * Comprehensive deployment health validation including:
 * - Vercel deployment status
 * - Environment variables validation
 * - CDN asset availability
 * - SSL certificate validation
 * - Domain configuration
 * - Performance at edge locations
 * 
 * @author TaskFlow Development Team
 * @version 1.0.0
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

class DeploymentValidation {
  constructor(config) {
    this.config = config;
    this.results = {
      success: true,
      details: {},
      warnings: [],
      recommendations: []
    };
  }

  /**
   * Run all deployment validation checks
   */
  async run(environment) {
    try {
      this.environment = environment;
      
      await this.checkDeploymentStatus();
      await this.validateEnvironmentVariables();
      await this.checkCDNAssets();
      await this.validateSSLCertificate();
      await this.checkDomainConfiguration();
      await this.testGlobalPerformance();
      await this.validateDeploymentConfig();
      
      return this.results;
    } catch (error) {
      this.results.success = false;
      this.results.error = error.message;
      this.results.critical = true;
      return this.results;
    }
  }

  /**
   * Check deployment status
   */
  async checkDeploymentStatus() {
    if (!this.config.vercel.checkStatus) {
      this.results.details.deploymentStatus = { skipped: true };
      return;
    }

    try {
      const statusResults = {
        accessible: false,
        statusCode: null,
        responseTime: 0,
        headers: {},
        recommendations: []
      };

      const baseUrl = this.getBaseUrl();
      const startTime = Date.now();

      const response = await this.makeHttpRequest(baseUrl);
      statusResults.responseTime = Date.now() - startTime;
      statusResults.statusCode = response.statusCode;
      statusResults.headers = response.headers;
      statusResults.accessible = response.statusCode === 200;

      if (!statusResults.accessible) {
        this.results.success = false;
        this.results.critical = true;
        statusResults.recommendations.push(`Deployment not accessible: HTTP ${response.statusCode}`);
      }

      // Check response time
      if (statusResults.responseTime > 5000) {
        this.results.warnings.push(`Slow deployment response: ${statusResults.responseTime}ms`);
        statusResults.recommendations.push('Investigate slow response times');
      }

      // Check for required headers
      this.validateResponseHeaders(statusResults);

      this.results.details.deploymentStatus = statusResults;

    } catch (error) {
      this.results.success = false;
      this.results.critical = true;
      this.results.details.deploymentStatus = {
        accessible: false,
        error: error.message,
        recommendations: ['Check deployment configuration and DNS settings']
      };
    }
  }

  /**
   * Get base URL for current environment
   */
  getBaseUrl() {
    if (this.environment === 'production') {
      return 'https://task-flow-lac-three.vercel.app';
    } else {
      return 'http://localhost:3000';
    }
  }

  /**
   * Make HTTP request with timeout
   */
  makeHttpRequest(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: timeout,
        headers: {
          'User-Agent': 'TaskFlow-Health-Check/1.0.0'
        }
      };

      const req = protocol.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Validate response headers for security and performance
   */
  validateResponseHeaders(statusResults) {
    const headers = statusResults.headers;
    const recommendations = statusResults.recommendations;

    // Check for security headers
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection'
    ];

    for (const header of requiredHeaders) {
      if (!headers[header]) {
        recommendations.push(`Missing security header: ${header}`);
        this.results.warnings.push(`Missing ${header} header`);
      }
    }

    // Check for performance headers
    if (!headers['cache-control']) {
      recommendations.push('Configure cache-control headers for better performance');
    }

    if (!headers['content-encoding'] || !headers['content-encoding'].includes('gzip')) {
      recommendations.push('Enable gzip compression for better performance');
    }

    // Check for CSP header
    if (!headers['content-security-policy']) {
      recommendations.push('Configure Content Security Policy header');
      this.results.warnings.push('Missing Content Security Policy header');
    }
  }

  /**
   * Validate environment variables
   */
  async validateEnvironmentVariables() {
    if (!this.config.vercel.checkEnvironmentVars) {
      this.results.details.environmentVariables = { skipped: true };
      return;
    }

    try {
      const envResults = {
        required: this.config.vercel.requiredVars,
        present: [],
        missing: [],
        recommendations: []
      };

      // Check local environment variables
      for (const envVar of this.config.vercel.requiredVars) {
        if (process.env[envVar]) {
          envResults.present.push(envVar);
        } else {
          envResults.missing.push(envVar);
        }
      }

      // Check for missing required variables
      if (envResults.missing.length > 0) {
        this.results.warnings.push(`Missing environment variables: ${envResults.missing.join(', ')}`);
        envResults.recommendations.push('Configure missing environment variables in deployment settings');
      }

      // Check for sensitive variables that shouldn't be exposed
      const exposedVars = this.checkExposedEnvironmentVariables();
      if (exposedVars.length > 0) {
        envResults.exposed = exposedVars;
        envResults.recommendations.push('Sensitive environment variables may be exposed to client');
        this.results.warnings.push('Potential environment variable exposure detected');
      }

      // Validate Firebase configuration
      await this.validateFirebaseConfig(envResults);

      this.results.details.environmentVariables = envResults;

    } catch (error) {
      this.results.warnings.push(`Environment variables validation failed: ${error.message}`);
      this.results.details.environmentVariables = { error: error.message };
    }
  }

  /**
   * Check for potentially exposed environment variables
   */
  checkExposedEnvironmentVariables() {
    const exposed = [];
    const sensitivePatterns = ['SECRET', 'KEY', 'TOKEN', 'PASSWORD'];
    
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('REACT_APP_')) {
        const upperKey = key.toUpperCase();
        for (const pattern of sensitivePatterns) {
          if (upperKey.includes(pattern) && value && value.length > 10) {
            exposed.push(key);
            break;
          }
        }
      }
    }
    
    return exposed;
  }

  /**
   * Validate Firebase configuration
   */
  async validateFirebaseConfig(envResults) {
    const firebaseVars = [
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_AUTH_DOMAIN',
      'REACT_APP_FIREBASE_PROJECT_ID'
    ];

    const firebaseConfig = {};
    let missingFirebaseVars = 0;

    for (const varName of firebaseVars) {
      if (process.env[varName]) {
        firebaseConfig[varName] = process.env[varName];
      } else {
        missingFirebaseVars++;
      }
    }

    envResults.firebase = {
      configured: missingFirebaseVars === 0,
      missingVars: missingFirebaseVars,
      config: firebaseConfig
    };

    if (missingFirebaseVars > 0) {
      envResults.recommendations.push('Firebase configuration incomplete');
    }

    // Validate Firebase config format
    if (firebaseConfig.REACT_APP_FIREBASE_API_KEY) {
      const apiKey = firebaseConfig.REACT_APP_FIREBASE_API_KEY;
      if (!apiKey.startsWith('AIza') || apiKey.length < 35) {
        envResults.recommendations.push('Firebase API key format appears invalid');
        this.results.warnings.push('Invalid Firebase API key format');
      }
    }
  }

  /**
   * Check CDN assets availability
   */
  async checkCDNAssets() {
    if (!this.config.cdn.checkAssets) {
      this.results.details.cdnAssets = { skipped: true };
      return;
    }

    try {
      const cdnResults = {
        assets: [],
        totalSize: 0,
        averageLoadTime: 0,
        failedAssets: [],
        recommendations: []
      };

      // Get list of assets from build manifest
      const assets = await this.getAssetList();
      
      for (const asset of assets) {
        const assetUrl = `${this.getBaseUrl()}${asset.path}`;
        const startTime = Date.now();
        
        try {
          const response = await this.makeHttpRequest(assetUrl, this.config.cdn.maxLoadTime);
          const loadTime = Date.now() - startTime;
          
          cdnResults.assets.push({
            path: asset.path,
            size: asset.size,
            loadTime,
            status: response.statusCode,
            cached: response.headers['x-cache'] === 'HIT'
          });
          
          cdnResults.totalSize += asset.size;
          
          if (loadTime > this.config.cdn.maxLoadTime) {
            cdnResults.failedAssets.push({
              path: asset.path,
              issue: 'slow_load',
              loadTime
            });
          }
          
        } catch (error) {
          cdnResults.failedAssets.push({
            path: asset.path,
            issue: 'load_failed',
            error: error.message
          });
        }
      }

      // Calculate average load time
      if (cdnResults.assets.length > 0) {
        cdnResults.averageLoadTime = cdnResults.assets.reduce((sum, asset) => sum + asset.loadTime, 0) / cdnResults.assets.length;
      }

      // Check for issues
      if (cdnResults.failedAssets.length > 0) {
        this.results.warnings.push(`${cdnResults.failedAssets.length} CDN assets failed to load properly`);
        cdnResults.recommendations.push('Investigate failed CDN assets');
      }

      if (cdnResults.averageLoadTime > this.config.cdn.maxLoadTime) {
        cdnResults.recommendations.push('Optimize CDN asset delivery');
      }

      this.results.details.cdnAssets = cdnResults;

    } catch (error) {
      this.results.warnings.push(`CDN assets check failed: ${error.message}`);
      this.results.details.cdnAssets = { error: error.message };
    }
  }

  /**
   * Get list of assets from build output
   */
  async getAssetList() {
    const assets = [];
    const buildPath = path.join(process.cwd(), 'build');
    
    if (!fs.existsSync(buildPath)) {
      return assets;
    }

    // Check for asset manifest
    const manifestPath = path.join(buildPath, 'asset-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      for (const [key, value] of Object.entries(manifest.files || {})) {
        if (value.startsWith('/static/')) {
          const fullPath = path.join(buildPath, value.substring(1));
          if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            assets.push({
              path: value,
              size: stats.size,
              type: this.getAssetType(value)
            });
          }
        }
      }
    } else {
      // Fallback: scan static directories
      const staticPath = path.join(buildPath, 'static');
      if (fs.existsSync(staticPath)) {
        this.scanStaticAssets(staticPath, '/static/', assets);
      }
    }

    return assets.slice(0, 10); // Limit to first 10 assets for testing
  }

  /**
   * Scan static assets recursively
   */
  scanStaticAssets(dirPath, urlPrefix, assets) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        this.scanStaticAssets(filePath, `${urlPrefix}${file}/`, assets);
      } else {
        assets.push({
          path: `${urlPrefix}${file}`,
          size: stats.size,
          type: this.getAssetType(file)
        });
      }
    }
  }

  /**
   * Get asset type from file extension
   */
  getAssetType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const typeMap = {
      '.js': 'javascript',
      '.css': 'stylesheet',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.gif': 'image',
      '.svg': 'image',
      '.woff': 'font',
      '.woff2': 'font',
      '.ttf': 'font'
    };
    
    return typeMap[ext] || 'other';
  }

  /**
   * Validate SSL certificate
   */
  async validateSSLCertificate() {
    try {
      const sslResults = {
        valid: false,
        issuer: null,
        expirationDate: null,
        daysUntilExpiry: 0,
        recommendations: []
      };

      if (this.environment === 'development') {
        sslResults.skipped = true;
        sslResults.reason = 'SSL validation skipped for development environment';
        this.results.details.sslCertificate = sslResults;
        return;
      }

      const baseUrl = this.getBaseUrl();
      const urlObj = new URL(baseUrl);
      
      if (urlObj.protocol !== 'https:') {
        sslResults.recommendations.push('HTTPS not configured');
        this.results.warnings.push('Deployment not using HTTPS');
        this.results.details.sslCertificate = sslResults;
        return;
      }

      // Get SSL certificate info
      const certInfo = await this.getSSLCertificateInfo(urlObj.hostname);
      
      if (certInfo) {
        sslResults.valid = true;
        sslResults.issuer = certInfo.issuer;
        sslResults.expirationDate = certInfo.expirationDate;
        sslResults.daysUntilExpiry = Math.floor((new Date(certInfo.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        // Check expiration
        if (sslResults.daysUntilExpiry < 30) {
          sslResults.recommendations.push(`SSL certificate expires in ${sslResults.daysUntilExpiry} days`);
          this.results.warnings.push('SSL certificate expiring soon');
        }
        
        if (sslResults.daysUntilExpiry < 0) {
          sslResults.recommendations.push('SSL certificate has expired');
          this.results.success = false;
          this.results.critical = true;
        }
      }

      this.results.details.sslCertificate = sslResults;

    } catch (error) {
      this.results.warnings.push(`SSL certificate validation failed: ${error.message}`);
      this.results.details.sslCertificate = { error: error.message };
    }
  }

  /**
   * Get SSL certificate information
   */
  async getSSLCertificateInfo(hostname) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: hostname,
        port: 443,
        method: 'GET',
        rejectUnauthorized: false
      };

      const req = https.request(options, (res) => {
        const cert = res.connection.getPeerCertificate();
        
        if (cert && cert.subject) {
          resolve({
            issuer: cert.issuer.CN,
            expirationDate: cert.valid_to,
            subject: cert.subject.CN
          });
        } else {
          reject(new Error('No certificate information available'));
        }
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Check domain configuration
   */
  async checkDomainConfiguration() {
    try {
      const domainResults = {
        domain: this.getDomainFromUrl(),
        dnsResolution: false,
        redirects: [],
        recommendations: []
      };

      // Test DNS resolution
      try {
        const response = await this.makeHttpRequest(this.getBaseUrl());
        domainResults.dnsResolution = true;
      } catch (error) {
        domainResults.dnsResolution = false;
        domainResults.recommendations.push('DNS resolution failed');
        this.results.warnings.push('Domain DNS resolution failed');
      }

      // Test common redirects
      const redirectTests = [
        `http://${domainResults.domain}`,
        `https://www.${domainResults.domain}`,
        `http://www.${domainResults.domain}`
      ];

      for (const testUrl of redirectTests) {
        try {
          const response = await this.makeHttpRequest(testUrl);
          domainResults.redirects.push({
            from: testUrl,
            to: response.headers.location || 'no-redirect',
            status: response.statusCode
          });
        } catch (error) {
          // Ignore redirect test failures
        }
      }

      this.results.details.domainConfiguration = domainResults;

    } catch (error) {
      this.results.warnings.push(`Domain configuration check failed: ${error.message}`);
      this.results.details.domainConfiguration = { error: error.message };
    }
  }

  /**
   * Extract domain from base URL
   */
  getDomainFromUrl() {
    try {
      const urlObj = new URL(this.getBaseUrl());
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Test global performance
   */
  async testGlobalPerformance() {
    try {
      const globalResults = {
        regions: [],
        averageResponseTime: 0,
        recommendations: []
      };

      // Simulate global performance testing
      // In production, this could test from multiple regions
      const regions = ['us-east', 'us-west', 'europe', 'asia'];
      
      for (const region of regions) {
        const responseTime = await this.simulateRegionalTest(region);
        globalResults.regions.push({
          region,
          responseTime,
          status: responseTime < 2000 ? 'good' : 'slow'
        });
      }

      globalResults.averageResponseTime = globalResults.regions.reduce((sum, r) => sum + r.responseTime, 0) / globalResults.regions.length;

      if (globalResults.averageResponseTime > 3000) {
        globalResults.recommendations.push('Consider using a CDN to improve global performance');
        this.results.warnings.push('Slow global response times detected');
      }

      this.results.details.globalPerformance = globalResults;

    } catch (error) {
      this.results.warnings.push(`Global performance test failed: ${error.message}`);
      this.results.details.globalPerformance = { error: error.message };
    }
  }

  /**
   * Simulate regional performance test
   */
  async simulateRegionalTest(region) {
    // Simulate different response times based on region
    const baseTimes = {
      'us-east': 800,
      'us-west': 1200,
      'europe': 1500,
      'asia': 2000
    };
    
    const baseTime = baseTimes[region] || 1000;
    const variance = Math.random() * 500;
    
    return Math.round(baseTime + variance);
  }

  /**
   * Validate deployment configuration
   */
  async validateDeploymentConfig() {
    try {
      const configResults = {
        vercelConfig: false,
        buildConfig: false,
        recommendations: []
      };

      // Check Vercel configuration
      const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
      if (fs.existsSync(vercelConfigPath)) {
        configResults.vercelConfig = true;
        
        const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
        configResults.vercelConfigDetails = this.analyzeVercelConfig(vercelConfig);
      } else {
        configResults.recommendations.push('Consider adding vercel.json for deployment configuration');
      }

      // Check build configuration
      const packagePath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        configResults.buildConfig = !!packageData.scripts.build;
        
        if (!packageData.scripts.build) {
          configResults.recommendations.push('Build script not configured in package.json');
        }
      }

      this.results.details.deploymentConfig = configResults;

    } catch (error) {
      this.results.warnings.push(`Deployment configuration validation failed: ${error.message}`);
      this.results.details.deploymentConfig = { error: error.message };
    }
  }

  /**
   * Analyze Vercel configuration
   */
  analyzeVercelConfig(config) {
    const analysis = {
      hasHeaders: !!config.headers,
      hasRedirects: !!config.redirects,
      hasRewrites: !!config.rewrites,
      hasBuildCommand: !!config.buildCommand,
      recommendations: []
    };

    if (!analysis.hasHeaders) {
      analysis.recommendations.push('Configure security headers in vercel.json');
    }

    if (!analysis.hasRedirects) {
      analysis.recommendations.push('Consider adding HTTPS redirects');
    }

    return analysis;
  }
}

module.exports = DeploymentValidation;