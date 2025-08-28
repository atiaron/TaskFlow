#!/usr/bin/env node

/**
 * 🔒 Security Audit Script
 * בדיקות ביטחון מקיפות לאפליקציית TaskFlow
 */

const fs = require('fs');
const path = require('path');

class SecurityAuditor {
  constructor() {
    this.results = [];
    this.criticalIssues = [];
    this.warnings = [];
  }

  log(message, level = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      critical: '🚨',
      security: '🔒'
    };
    
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      critical: '\x1b[31m',
      security: '\x1b[35m',
      reset: '\x1b[0m'
    };

    console.log(`${colors[level]}${icons[level]} ${message}${colors.reset}`);
    
    const result = { level, message, timestamp: new Date().toISOString() };
    this.results.push(result);
    
    if (level === 'critical') {
      this.criticalIssues.push(result);
    } else if (level === 'warning') {
      this.warnings.push(result);
    }
  }

  // 🔍 בדיקת חשיפת מידע רגיש בקוד
  async checkSecretsInCode() {
    this.log('🔍 Scanning for hardcoded secrets...', 'security');

    const secretPatterns = [
      { name: 'API Keys', pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"`]([^'"`\s]{20,})['"`]/gi },
      { name: 'Passwords', pattern: /(?:password|pwd|pass)\s*[:=]\s*['"`]([^'"`\s]{8,})['"`]/gi },
      { name: 'Tokens', pattern: /(?:token|access[_-]?token)\s*[:=]\s*['"`]([^'"`\s]{20,})['"`]/gi },
      { name: 'Private Keys', pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi },
      { name: 'Firebase Keys', pattern: /(?:firebase[_-]?(?:api[_-]?)?key)\s*[:=]\s*['"`]([^'"`\s]{30,})['"`]/gi },
      { name: 'Database URLs', pattern: /(?:database[_-]?url|db[_-]?url)\s*[:=]\s*['"`]([^'"`\s]{10,})['"`]/gi },
      { name: 'Secret Keys', pattern: /(?:secret[_-]?key|secret)\s*[:=]\s*['"`]([^'"`\s]{16,})['"`]/gi }
    ];

    const suspiciousFiles = [];
    const srcPath = path.join(process.cwd(), 'src');
    
    if (!fs.existsSync(srcPath)) {
      this.log('Source directory not found', 'warning');
      return;
    }

    const scanDirectory = (dir, relativePath = '') => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const relativeFilePath = path.join(relativePath, file);
        
        if (fs.statSync(filePath).isDirectory() && !file.startsWith('.')) {
          scanDirectory(filePath, relativeFilePath);
        } else if (file.match(/\.(ts|tsx|js|jsx|json)$/)) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            secretPatterns.forEach(({ name, pattern }) => {
              const matches = content.match(pattern);
              if (matches) {
                matches.forEach(match => {
                  suspiciousFiles.push({
                    file: relativeFilePath,
                    type: name,
                    match: match.substring(0, 50) + '...',
                    line: content.substring(0, content.indexOf(match)).split('\n').length
                  });
                });
              }
            });
            
          } catch (error) {
            this.log(`Error reading ${relativeFilePath}: ${error.message}`, 'warning');
          }
        }
      });
    };

    scanDirectory(srcPath);

    if (suspiciousFiles.length > 0) {
      this.log(`🚨 Found ${suspiciousFiles.length} potential secrets in code!`, 'critical');
      suspiciousFiles.forEach(item => {
        this.log(`  ${item.file}:${item.line} - ${item.type}: ${item.match}`, 'critical');
      });
    } else {
      this.log('No obvious secrets found in source code', 'success');
    }
  }

  // 🔒 בדיקת הגדרות Content Security Policy
  async checkCSP() {
    this.log('🔒 Checking Content Security Policy...', 'security');

    const locations = [
      { file: 'public/index.html', type: 'meta tag' },
      { file: 'firebase.json', type: 'hosting headers' },
      { file: 'vercel.json', type: 'headers config' }
    ];

    let cspFound = false;
    
    for (const location of locations) {
      const filePath = path.join(process.cwd(), location.file);
      
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          if (content.includes('Content-Security-Policy')) {
            cspFound = true;
            this.log(`CSP found in ${location.file} (${location.type})`, 'success');
            
            // ניתוח CSP
            const cspMatch = content.match(/Content-Security-Policy['"]\s*:\s*['"]([^'"]+)['"]/i);
            if (cspMatch) {
              const csp = cspMatch[1];
              
              // בדיקת directives חשובות
              const importantDirectives = [
                'default-src',
                'script-src',
                'style-src',
                'img-src',
                'connect-src',
                'font-src'
              ];

              const missingDirectives = importantDirectives.filter(directive => 
                !csp.includes(directive)
              );

              if (missingDirectives.length > 0) {
                this.log(`Missing CSP directives: ${missingDirectives.join(', ')}`, 'warning');
              } else {
                this.log('CSP has all important directives', 'success');
              }

              // בדיקת unsafe directives
              if (csp.includes('unsafe-inline') || csp.includes('unsafe-eval')) {
                this.log('CSP contains unsafe directives - security risk!', 'critical');
              } else {
                this.log('CSP does not contain unsafe directives', 'success');
              }
            }
          }
        } catch (error) {
          this.log(`Error reading ${location.file}: ${error.message}`, 'warning');
        }
      }
    }

    if (!cspFound) {
      this.log('No Content Security Policy found - security risk!', 'critical');
    }
  }

  // 📦 בדיקת חבילות עם פגיעויות ביטחון
  async checkDependencyVulnerabilities() {
    this.log('📦 Checking for vulnerable dependencies...', 'security');

    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.log('package.json not found', 'warning');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const allDeps = { 
        ...packageJson.dependencies, 
        ...packageJson.devDependencies 
      };

      // בדיקת חבילות עם בעיות ביטחון ידועות
      const knownVulnerable = [
        { name: 'lodash', versions: ['<4.17.21'], issue: 'Prototype pollution' },
        { name: 'axios', versions: ['<0.21.4'], issue: 'SSRF vulnerability' },
        { name: 'react-scripts', versions: ['<5.0.0'], issue: 'Multiple vulnerabilities' },
        { name: 'serialize-javascript', versions: ['<6.0.0'], issue: 'XSS vulnerability' }
      ];

      let vulnerablePackages = [];
      
      Object.entries(allDeps).forEach(([pkg, version]) => {
        const vulnerable = knownVulnerable.find(v => v.name === pkg);
        if (vulnerable) {
          // פשוט לבדוק אם הגרסה לא עודכנה
          const cleanVersion = version.replace(/[\^~]/, '');
          vulnerablePackages.push({
            package: pkg,
            version: cleanVersion,
            issue: vulnerable.issue
          });
        }
      });

      if (vulnerablePackages.length > 0) {
        this.log(`Found ${vulnerablePackages.length} potentially vulnerable packages:`, 'critical');
        vulnerablePackages.forEach(pkg => {
          this.log(`  ${pkg.package}@${pkg.version}: ${pkg.issue}`, 'critical');
        });
      } else {
        this.log('No known vulnerable packages detected', 'success');
      }
      
      // React version check
      if (allDeps.react) {
        const reactVersion = allDeps.react.replace(/[\^~]/, '');
        const majorVersion = parseInt(reactVersion.split('.')[0]);
        
        if (majorVersion < 18) {
          this.log(`React version ${reactVersion} is outdated (current: 18+)`, 'warning');
        } else {
          this.log(`React version ${reactVersion} is current`, 'success');
        }
      }

    } catch (error) {
      this.log(`Error analyzing dependencies: ${error.message}`, 'warning');
    }
  }

  // 🔐 בדיקת הגדרות Authentication
  async checkAuthSecurity() {
    this.log('🔐 Checking authentication security...', 'security');

    const authFiles = [
      'src/services/auth.ts',
      'src/services/auth.js',
      'src/components/Auth',
      'src/hooks/useAuth.ts',
      'src/context/AuthContext.tsx'
    ];

    let authImplementationFound = false;
    const authFeatures = {
      emailAuth: false,
      googleAuth: false,
      passwordValidation: false,
      sessionManagement: false,
      tokenRefresh: false
    };

    for (const authFile of authFiles) {
      const filePath = path.join(process.cwd(), authFile);
      
      if (fs.existsSync(filePath)) {
        authImplementationFound = true;
        
        try {
          let content = '';
          if (fs.statSync(filePath).isDirectory()) {
            // אם זה תיקייה, בדוק כל הקבצים בתוכה
            const files = fs.readdirSync(filePath);
            files.forEach(file => {
              if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                content += fs.readFileSync(path.join(filePath, file), 'utf8') + '\n';
              }
            });
          } else {
            content = fs.readFileSync(filePath, 'utf8');
          }

          // בדיקת features
          if (content.includes('signInWithEmailAndPassword') || content.includes('createUserWithEmailAndPassword')) {
            authFeatures.emailAuth = true;
          }
          
          if (content.includes('GoogleAuthProvider') || content.includes('signInWithPopup')) {
            authFeatures.googleAuth = true;
          }
          
          if (content.includes('password') && (content.includes('length') || content.includes('regex') || content.includes('validation'))) {
            authFeatures.passwordValidation = true;
          }
          
          if (content.includes('onAuthStateChanged') || content.includes('useAuthState')) {
            authFeatures.sessionManagement = true;
          }
          
          if (content.includes('getIdToken') || content.includes('refreshToken')) {
            authFeatures.tokenRefresh = true;
          }

        } catch (error) {
          this.log(`Error reading ${authFile}: ${error.message}`, 'warning');
        }
      }
    }

    if (!authImplementationFound) {
      this.log('No authentication implementation found', 'warning');
      return;
    }

    // דוח על features
    Object.entries(authFeatures).forEach(([feature, implemented]) => {
      const featureNames = {
        emailAuth: 'Email/Password Authentication',
        googleAuth: 'Google Authentication',
        passwordValidation: 'Password Validation',
        sessionManagement: 'Session Management',
        tokenRefresh: 'Token Refresh'
      };
      
      if (implemented) {
        this.log(`${featureNames[feature]} implemented`, 'success');
      } else {
        this.log(`${featureNames[feature]} not found`, 'warning');
      }
    });

    // בדיקת Firebase Auth configuration
    const firebaseConfigPaths = [
      'src/firebase.ts',
      'src/firebase.js',
      'src/config/firebase.ts'
    ];

    for (const configPath of firebaseConfigPaths) {
      const filePath = path.join(process.cwd(), configPath);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          if (content.includes('getAuth')) {
            this.log('Firebase Auth properly initialized', 'success');
          }
          
          // בדיקת Auth providers
          const providers = ['GoogleAuthProvider', 'FacebookAuthProvider', 'TwitterAuthProvider', 'GithubAuthProvider'];
          const configuredProviders = providers.filter(provider => content.includes(provider));
          
          if (configuredProviders.length > 0) {
            this.log(`OAuth providers configured: ${configuredProviders.join(', ')}`, 'success');
          }
          
        } catch (error) {
          this.log(`Error reading Firebase config: ${error.message}`, 'warning');
        }
        break;
      }
    }
  }

  // 🌐 בדיקת הגדרות HTTPS ו-CORS
  async checkNetworkSecurity() {
    this.log('🌐 Checking network security settings...', 'security');

    // בדיקת HTTPS enforcement
    const publicPath = path.join(process.cwd(), 'public');
    const buildPath = path.join(process.cwd(), 'build');
    
    for (const checkPath of [publicPath, buildPath]) {
      const indexPath = path.join(checkPath, 'index.html');
      
      if (fs.existsSync(indexPath)) {
        try {
          const content = fs.readFileSync(indexPath, 'utf8');
          
          // בדיקת HTTPS redirect
          if (content.includes('upgrade-insecure-requests')) {
            this.log(`HTTPS upgrade policy found in ${path.basename(checkPath)}/index.html`, 'success');
          } else {
            this.log(`No HTTPS upgrade policy in ${path.basename(checkPath)}/index.html`, 'warning');
          }
          
          // בדיקת X-Frame-Options
          if (content.includes('X-Frame-Options') || content.includes('frame-ancestors')) {
            this.log(`Clickjacking protection found in ${path.basename(checkPath)}/index.html`, 'success');
          } else {
            this.log(`No clickjacking protection in ${path.basename(checkPath)}/index.html`, 'warning');
          }
          
        } catch (error) {
          this.log(`Error reading ${indexPath}: ${error.message}`, 'warning');
        }
      }
    }

    // בדיקת Vercel security headers
    const vercelPath = path.join(process.cwd(), 'vercel.json');
    if (fs.existsSync(vercelPath)) {
      try {
        const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
        
        if (vercelConfig.headers) {
          const securityHeaders = [
            'X-Frame-Options',
            'X-Content-Type-Options',
            'Referrer-Policy',
            'Permissions-Policy',
            'Strict-Transport-Security'
          ];
          
          const configuredHeaders = vercelConfig.headers.flatMap(headerConfig => 
            Object.keys(headerConfig.headers || {})
          );
          
          const missingHeaders = securityHeaders.filter(header => 
            !configuredHeaders.includes(header)
          );
          
          if (missingHeaders.length === 0) {
            this.log('All important security headers configured in Vercel', 'success');
          } else {
            this.log(`Missing security headers in Vercel: ${missingHeaders.join(', ')}`, 'warning');
          }
        } else {
          this.log('No security headers configured in Vercel', 'warning');
        }
        
      } catch (error) {
        this.log(`Error reading vercel.json: ${error.message}`, 'warning');
      }
    }
  }

  // 📝 בדיקת הגדרות לוגים ומעקב
  async checkLoggingSecurity() {
    this.log('📝 Checking logging and monitoring...', 'security');

    const srcPath = path.join(process.cwd(), 'src');
    if (!fs.existsSync(srcPath)) return;

    let foundConsoleLog = false;
    let foundSensitiveLogging = false;
    const logPatterns = [
      /console\.(log|debug|info|warn|error)/g,
      /console\.(log|debug|info|warn|error)\([^)]*(?:password|token|key|secret)/gi
    ];

    const scanForLogs = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        
        if (fs.statSync(filePath).isDirectory() && !file.startsWith('.')) {
          scanForLogs(filePath);
        } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            if (logPatterns[0].test(content)) {
              foundConsoleLog = true;
            }
            
            if (logPatterns[1].test(content)) {
              foundSensitiveLogging = true;
              this.log(`Sensitive data in console.log found in ${file}`, 'critical');
            }
            
          } catch (error) {
            // Ignore read errors
          }
        }
      });
    };

    scanForLogs(srcPath);

    if (foundSensitiveLogging) {
      this.log('🚨 Sensitive data being logged to console!', 'critical');
    } else if (foundConsoleLog) {
      this.log('Console logging found - ensure no sensitive data is logged in production', 'warning');
    } else {
      this.log('No console logging found', 'success');
    }

    // בדיקת error tracking
    const errorTrackingServices = ['Sentry', 'LogRocket', 'Bugsnag', 'Rollbar'];
    let hasErrorTracking = false;

    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      errorTrackingServices.forEach(service => {
        const packageName = `@${service.toLowerCase()}/${service.toLowerCase()}`;
        if (allDeps[packageName] || allDeps[service.toLowerCase()]) {
          hasErrorTracking = true;
          this.log(`Error tracking service found: ${service}`, 'success');
        }
      });
      
    } catch (error) {
      // Ignore
    }

    if (!hasErrorTracking) {
      this.log('No error tracking service found - consider adding one', 'warning');
    }
  }

  // 🎯 הפעלת כל בדיקות הביטחון
  async runSecurityAudit() {
    console.log('🔒 Starting Security Audit...\n');

    await this.checkSecretsInCode();
    await this.checkCSP();
    await this.checkDependencyVulnerabilities();
    await this.checkAuthSecurity();
    await this.checkNetworkSecurity();
    await this.checkLoggingSecurity();

    // סיכום ביטחון
    const totalChecks = this.results.length;
    const criticalCount = this.criticalIssues.length;
    const warningCount = this.warnings.length;
    const successCount = totalChecks - criticalCount - warningCount;

    console.log(`\n🎯 Security Audit Summary:`);
    console.log(`✅ Passed: ${successCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    console.log(`🚨 Critical: ${criticalCount}`);

    // חישוב ציון ביטחון
    let securityScore = 100;
    securityScore -= criticalCount * 20;
    securityScore -= warningCount * 5;
    securityScore = Math.max(0, securityScore);

    let securityLevel, color;
    if (securityScore >= 90) {
      securityLevel = 'Excellent';
      color = '\x1b[32m';
    } else if (securityScore >= 75) {
      securityLevel = 'Good';
      color = '\x1b[32m';
    } else if (securityScore >= 60) {
      securityLevel = 'Fair';
      color = '\x1b[33m';
    } else {
      securityLevel = 'Poor';
      color = '\x1b[31m';
    }

    console.log(`\n${color}🔒 Security Score: ${securityScore}/100 (${securityLevel})\x1b[0m`);

    if (criticalCount > 0) {
      console.log('\n🚨 Critical Issues Found:');
      this.criticalIssues.forEach(issue => {
        console.log(`   ${issue.message}`);
      });
    }

    return {
      score: securityScore,
      level: securityLevel,
      critical: criticalCount,
      warnings: warningCount,
      passed: successCount,
      results: this.results
    };
  }
}

// Run if called directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runSecurityAudit().catch(error => {
    console.error('Security audit failed:', error);
    process.exit(1);
  });
}

module.exports = { SecurityAuditor };
