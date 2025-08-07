/**
 * Security Audit Module
 * 
 * Comprehensive security validation including:
 * - CSP headers analysis
 * - Security headers validation
 * - Vulnerability scanning
 * - API key exposure checks
 * - HTTPS enforcement
 * - Content security validation
 * 
 * @author TaskFlow Development Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

class SecurityAudit {
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
   * Run all security checks
   */
  async run() {
    try {
      await this.checkCSPHeaders();
      await this.validateSecurityHeaders();
      await this.scanVulnerabilities();
      await this.checkAPIKeyExposure();
      await this.validateHTTPS();
      await this.checkContentSecurity();
      
      return this.results;
    } catch (error) {
      this.results.success = false;
      this.results.error = error.message;
      this.results.critical = true;
      return this.results;
    }
  }

  /**
   * Check Content Security Policy headers
   */
  async checkCSPHeaders() {
    try {
      const cspConfig = this.config.csp;
      const cspResults = {
        configured: false,
        policies: {},
        violations: [],
        recommendations: []
      };

      // Check if CSP is configured in the app
      const publicIndexPath = path.join(process.cwd(), 'public', 'index.html');
      if (fs.existsSync(publicIndexPath)) {
        const indexContent = fs.readFileSync(publicIndexPath, 'utf8');
        
        // Look for CSP meta tag
        const cspMetaMatch = indexContent.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i);
        if (cspMetaMatch) {
          cspResults.configured = true;
          const cspContent = cspMetaMatch[0].match(/content=["']([^"']+)["']/i);
          if (cspContent) {
            cspResults.policies = this.parseCSPHeader(cspContent[1]);
          }
        }

        // Check for nonce or hash usage
        cspResults.hasNonce = indexContent.includes('nonce=');
        cspResults.hasInlineStyles = indexContent.includes('<style>') || indexContent.includes('style=');
        cspResults.hasInlineScripts = indexContent.includes('<script>') && !indexContent.includes('src=');
      }

      // Check build output for CSP headers
      const buildPath = path.join(process.cwd(), 'build');
      if (fs.existsSync(buildPath)) {
        const buildIndexPath = path.join(buildPath, 'index.html');
        if (fs.existsSync(buildIndexPath)) {
          const buildContent = fs.readFileSync(buildIndexPath, 'utf8');
          cspResults.buildHasCSP = buildContent.includes('Content-Security-Policy');
        }
      }

      // Validate CSP configuration
      if (cspResults.configured) {
        this.validateCSPPolicies(cspResults.policies, cspResults);
      } else if (cspConfig.required) {
        this.results.success = false;
        cspResults.recommendations.push('Content Security Policy is required but not configured');
      }

      this.results.details.csp = cspResults;

    } catch (error) {
      this.results.warnings.push(`CSP check failed: ${error.message}`);
      this.results.details.csp = { error: error.message };
    }
  }

  /**
   * Parse CSP header into policies
   */
  parseCSPHeader(cspHeader) {
    const policies = {};
    const directives = cspHeader.split(';');

    for (const directive of directives) {
      const parts = directive.trim().split(' ');
      if (parts.length > 0) {
        const directiveName = parts[0];
        const sources = parts.slice(1);
        policies[directiveName] = sources;
      }
    }

    return policies;
  }

  /**
   * Validate CSP policies against security best practices
   */
  validateCSPPolicies(policies, cspResults) {
    const recommendations = cspResults.recommendations;

    // Check for unsafe-inline
    for (const [directive, sources] of Object.entries(policies)) {
      if (sources.includes("'unsafe-inline'")) {
        if (!this.config.csp.allowUnsafeInline) {
          recommendations.push(`Unsafe inline detected in ${directive} - consider using nonces or hashes`);
          this.results.warnings.push(`CSP allows unsafe-inline in ${directive}`);
        }
      }

      if (sources.includes("'unsafe-eval'")) {
        if (!this.config.csp.allowUnsafeEval) {
          recommendations.push(`Unsafe eval detected in ${directive} - avoid dynamic code execution`);
          this.results.warnings.push(`CSP allows unsafe-eval in ${directive}`);
        }
      }
    }

    // Check for missing important directives
    const importantDirectives = ['default-src', 'script-src', 'style-src', 'img-src'];
    for (const directive of importantDirectives) {
      if (!policies[directive]) {
        recommendations.push(`Consider adding ${directive} directive to CSP`);
      }
    }

    // Check for overly permissive policies
    if (policies['default-src'] && policies['default-src'].includes('*')) {
      recommendations.push('Default-src allows all sources (*) - consider being more restrictive');
      this.results.warnings.push('CSP default-src is overly permissive');
    }
  }

  /**
   * Validate security headers
   */
  async validateSecurityHeaders() {
    try {
      const headerResults = {
        expected: this.config.headers,
        found: {},
        missing: [],
        recommendations: []
      };

      // Check if security headers are configured
      const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
      if (fs.existsSync(vercelConfigPath)) {
        const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
        
        if (vercelConfig.headers) {
          headerResults.vercelHeaders = vercelConfig.headers;
          
          // Check each expected header
          for (const [headerName, expectedValue] of Object.entries(this.config.headers)) {
            const found = this.findHeaderInVercelConfig(vercelConfig.headers, headerName);
            if (found) {
              headerResults.found[headerName] = found;
            } else {
              headerResults.missing.push(headerName);
              headerResults.recommendations.push(`Add ${headerName}: ${expectedValue} header`);
            }
          }
        } else {
          headerResults.recommendations.push('No security headers configured in vercel.json');
        }
      }

      // Check for common security misconfigurations
      if (headerResults.missing.length > 0) {
        this.results.warnings.push(`Missing security headers: ${headerResults.missing.join(', ')}`);
      }

      this.results.details.securityHeaders = headerResults;

    } catch (error) {
      this.results.warnings.push(`Security headers check failed: ${error.message}`);
      this.results.details.securityHeaders = { error: error.message };
    }
  }

  /**
   * Find header in Vercel configuration
   */
  findHeaderInVercelConfig(headers, headerName) {
    for (const headerConfig of headers) {
      if (headerConfig.headers) {
        for (const header of headerConfig.headers) {
          if (header.key === headerName) {
            return header.value;
          }
        }
      }
    }
    return null;
  }

  /**
   * Scan for vulnerabilities using npm audit
   */
  async scanVulnerabilities() {
    try {
      const execAsync = promisify(exec);
      const auditResults = {
        npmAudit: {},
        recommendations: []
      };

      try {
        // Run npm audit to check for vulnerabilities
        const { stdout } = await execAsync('npm audit --json', { 
          cwd: process.cwd(),
          timeout: 30000 
        });
        
        const auditData = JSON.parse(stdout);
        auditResults.npmAudit = {
          vulnerabilities: auditData.vulnerabilities || {},
          summary: auditData.metadata || {},
          success: true
        };

        // Analyze vulnerability levels
        const summary = auditData.metadata;
        if (summary) {
          const { vulnerabilities } = summary;
          
          if (vulnerabilities.critical > this.config.vulnerabilities.maxCritical) {
            this.results.success = false;
            this.results.critical = true;
            auditResults.recommendations.push(`${vulnerabilities.critical} critical vulnerabilities found - immediate action required`);
          }

          if (vulnerabilities.high > this.config.vulnerabilities.maxHigh) {
            this.results.warnings.push(`${vulnerabilities.high} high severity vulnerabilities found`);
            auditResults.recommendations.push('Update dependencies to fix high severity vulnerabilities');
          }

          if (vulnerabilities.moderate > this.config.vulnerabilities.maxMedium) {
            this.results.warnings.push(`${vulnerabilities.moderate} moderate vulnerabilities found`);
            auditResults.recommendations.push('Consider updating dependencies with moderate vulnerabilities');
          }
        }

      } catch (auditError) {
        // npm audit returns non-zero exit code when vulnerabilities found
        if (auditError.stdout) {
          const auditData = JSON.parse(auditError.stdout);
          auditResults.npmAudit = {
            vulnerabilities: auditData.vulnerabilities || {},
            summary: auditData.metadata || {},
            success: false,
            hasVulnerabilities: true
          };
        } else {
          auditResults.npmAudit = {
            success: false,
            error: auditError.message
          };
        }
      }

      this.results.details.vulnerabilities = auditResults;

    } catch (error) {
      this.results.warnings.push(`Vulnerability scan failed: ${error.message}`);
      this.results.details.vulnerabilities = { error: error.message };
    }
  }

  /**
   * Check for exposed API keys and secrets
   */
  async checkAPIKeyExposure() {
    try {
      const exposureResults = {
        envFile: {},
        sourceCode: {},
        buildOutput: {},
        recommendations: []
      };

      // Check .env files
      await this.checkEnvFiles(exposureResults);
      
      // Scan source code for exposed secrets
      await this.scanSourceCode(exposureResults);
      
      // Check build output for exposed secrets
      await this.checkBuildOutput(exposureResults);

      this.results.details.apiKeyExposure = exposureResults;

    } catch (error) {
      this.results.warnings.push(`API key exposure check failed: ${error.message}`);
      this.results.details.apiKeyExposure = { error: error.message };
    }
  }

  /**
   * Check environment files for proper configuration
   */
  async checkEnvFiles(exposureResults) {
    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    
    for (const envFile of envFiles) {
      const envPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        exposureResults.envFile[envFile] = {
          exists: true,
          hasReactAppPrefix: envContent.includes('REACT_APP_'),
          hasSecrets: this.detectSecrets(envContent),
          size: envContent.length
        };
        
        // Check for non-REACT_APP prefixed variables that might be exposed
        const lines = envContent.split('\n');
        const exposedVars = lines.filter(line => 
          line.trim() && 
          !line.startsWith('#') && 
          !line.startsWith('REACT_APP_') &&
          line.includes('=')
        );
        
        if (exposedVars.length > 0) {
          exposureResults.recommendations.push(`${envFile} contains non-REACT_APP variables that won't be available in React`);
        }
      }
    }

    // Check for .env.example
    const envExamplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(envExamplePath)) {
      const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
      exposureResults.envFile['.env.example'] = {
        exists: true,
        hasActualValues: this.detectActualValues(exampleContent)
      };
      
      if (exposureResults.envFile['.env.example'].hasActualValues) {
        exposureResults.recommendations.push('.env.example contains actual values instead of placeholders');
        this.results.warnings.push('Potential secret exposure in .env.example');
      }
    }
  }

  /**
   * Scan source code for hardcoded secrets
   */
  async scanSourceCode(exposureResults) {
    const srcPath = path.join(process.cwd(), 'src');
    if (!fs.existsSync(srcPath)) return;

    const scanResults = {
      filesScanned: 0,
      potentialSecrets: [],
      recommendations: []
    };

    const scanDirectory = (dirPath) => {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          scanDirectory(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
          scanResults.filesScanned++;
          const content = fs.readFileSync(filePath, 'utf8');
          const secrets = this.detectHardcodedSecrets(content, filePath);
          scanResults.potentialSecrets.push(...secrets);
        }
      }
    };

    scanDirectory(srcPath);

    if (scanResults.potentialSecrets.length > 0) {
      this.results.warnings.push(`${scanResults.potentialSecrets.length} potential hardcoded secrets found`);
      scanResults.recommendations.push('Move hardcoded secrets to environment variables');
    }

    exposureResults.sourceCode = scanResults;
  }

  /**
   * Check build output for exposed secrets
   */
  async checkBuildOutput(exposureResults) {
    const buildPath = path.join(process.cwd(), 'build');
    if (!fs.existsSync(buildPath)) {
      exposureResults.buildOutput = { exists: false };
      return;
    }

    const buildResults = {
      exists: true,
      jsFiles: [],
      exposedSecrets: [],
      recommendations: []
    };

    // Check JavaScript files in build
    const staticJsPath = path.join(buildPath, 'static', 'js');
    if (fs.existsSync(staticJsPath)) {
      const jsFiles = fs.readdirSync(staticJsPath).filter(file => file.endsWith('.js'));
      
      for (const jsFile of jsFiles) {
        const jsPath = path.join(staticJsPath, jsFile);
        const content = fs.readFileSync(jsPath, 'utf8');
        
        // Look for Firebase config or other exposed secrets
        const secrets = this.detectExposedSecretsInBuild(content, jsFile);
        buildResults.exposedSecrets.push(...secrets);
        buildResults.jsFiles.push({
          name: jsFile,
          size: content.length,
          hasFirebaseConfig: content.includes('firebase'),
          secretsFound: secrets.length
        });
      }
    }

    if (buildResults.exposedSecrets.length > 0) {
      this.results.warnings.push(`${buildResults.exposedSecrets.length} secrets exposed in build output`);
      buildResults.recommendations.push('Review build configuration to prevent secret exposure');
    }

    exposureResults.buildOutput = buildResults;
  }

  /**
   * Detect secrets in content
   */
  detectSecrets(content) {
    const secretPatterns = [
      /api[_-]?key/i,
      /secret/i,
      /password/i,
      /token/i,
      /private[_-]?key/i
    ];

    return secretPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Detect actual values in example files
   */
  detectActualValues(content) {
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [, value] = trimmed.split('=');
        if (value && value !== 'your-value-here' && value !== 'your-api-key' && !value.startsWith('your-')) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Detect hardcoded secrets in source code
   */
  detectHardcodedSecrets(content, filePath) {
    const secrets = [];
    const lines = content.split('\n');
    
    const secretPatterns = [
      { pattern: /"sk-[a-zA-Z0-9]{32,}"/, type: 'OpenAI API Key' },
      { pattern: /"AIza[0-9A-Za-z-_]{35}"/, type: 'Google API Key' },
      { pattern: /firebase.*"[a-zA-Z0-9-_]{32,}"/, type: 'Firebase Key' },
      { pattern: /"[0-9]{10,}:[a-zA-Z0-9-_]{32,}"/, type: 'Firebase App ID' }
    ];

    lines.forEach((line, index) => {
      for (const { pattern, type } of secretPatterns) {
        if (pattern.test(line)) {
          secrets.push({
            file: filePath.replace(process.cwd(), ''),
            line: index + 1,
            type,
            severity: 'high'
          });
        }
      }
    });

    return secrets;
  }

  /**
   * Detect exposed secrets in build output
   */
  detectExposedSecretsInBuild(content, fileName) {
    const secrets = [];
    
    // Check for exposed environment variables
    const envPattern = /process\.env\.([A-Z_]+)/g;
    let match;
    
    while ((match = envPattern.exec(content)) !== null) {
      const envVar = match[1];
      if (!envVar.startsWith('REACT_APP_')) {
        secrets.push({
          file: fileName,
          type: 'Environment Variable',
          variable: envVar,
          severity: 'medium'
        });
      }
    }

    return secrets;
  }

  /**
   * Validate HTTPS enforcement
   */
  async validateHTTPS() {
    try {
      const httpsResults = {
        enforced: false,
        redirects: false,
        recommendations: []
      };

      // Check Vercel configuration for HTTPS redirect
      const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
      if (fs.existsSync(vercelConfigPath)) {
        const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
        
        if (vercelConfig.redirects) {
          const httpsRedirect = vercelConfig.redirects.find(redirect => 
            redirect.source === 'http://*' || 
            redirect.destination?.includes('https://')
          );
          
          if (httpsRedirect) {
            httpsResults.redirects = true;
            httpsResults.enforced = true;
          }
        }

        // Check for HSTS header
        if (vercelConfig.headers) {
          const hstsHeader = this.findHeaderInVercelConfig(vercelConfig.headers, 'Strict-Transport-Security');
          if (hstsHeader) {
            httpsResults.hsts = true;
            httpsResults.enforced = true;
          }
        }
      }

      if (!httpsResults.enforced) {
        httpsResults.recommendations.push('Configure HTTPS redirects and HSTS headers');
        this.results.warnings.push('HTTPS not properly enforced');
      }

      this.results.details.https = httpsResults;

    } catch (error) {
      this.results.warnings.push(`HTTPS validation failed: ${error.message}`);
      this.results.details.https = { error: error.message };
    }
  }

  /**
   * Check content security
   */
  async checkContentSecurity() {
    try {
      const contentResults = {
        dependencies: {},
        integrity: {},
        recommendations: []
      };

      // Check package.json for security-related configurations
      const packagePath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        contentResults.dependencies = {
          total: Object.keys(packageData.dependencies || {}).length,
          devDependencies: Object.keys(packageData.devDependencies || {}).length,
          hasSecurityDeps: this.hasSecurityDependencies(packageData)
        };

        // Check for potentially risky dependencies
        const riskyDeps = this.findRiskyDependencies(packageData);
        if (riskyDeps.length > 0) {
          contentResults.recommendations.push(`Review risky dependencies: ${riskyDeps.join(', ')}`);
          this.results.warnings.push(`Found ${riskyDeps.length} potentially risky dependencies`);
        }
      }

      // Check for subresource integrity in build
      const buildIndexPath = path.join(process.cwd(), 'build', 'index.html');
      if (fs.existsSync(buildIndexPath)) {
        const buildContent = fs.readFileSync(buildIndexPath, 'utf8');
        contentResults.integrity = {
          hasIntegrityChecks: buildContent.includes('integrity='),
          hasCrossorigin: buildContent.includes('crossorigin=')
        };
      }

      this.results.details.contentSecurity = contentResults;

    } catch (error) {
      this.results.warnings.push(`Content security check failed: ${error.message}`);
      this.results.details.contentSecurity = { error: error.message };
    }
  }

  /**
   * Check if package has security-related dependencies
   */
  hasSecurityDependencies(packageData) {
    const securityDeps = ['helmet', 'cors', 'express-rate-limit', 'express-validator'];
    const allDeps = {
      ...(packageData.dependencies || {}),
      ...(packageData.devDependencies || {})
    };
    
    return securityDeps.some(dep => allDeps[dep]);
  }

  /**
   * Find potentially risky dependencies
   */
  findRiskyDependencies(packageData) {
    const riskyPatterns = [
      'eval',
      'shell',
      'exec',
      'unsafe'
    ];
    
    const allDeps = {
      ...(packageData.dependencies || {}),
      ...(packageData.devDependencies || {})
    };
    
    return Object.keys(allDeps).filter(dep => 
      riskyPatterns.some(pattern => dep.includes(pattern))
    );
  }
}

module.exports = SecurityAudit;