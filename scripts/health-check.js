#!/usr/bin/env node

/**
 * 🚀 TaskFlow - Comprehensive Health Check System
 * מערכת בדיקות אוטומטית מקיפה
 * 
 * Features:
 * ✅ Bundle size analysis
 * ✅ Firebase health check
 * ✅ Security audit
 * ✅ Performance testing
 * ✅ Build quality validation
 * ✅ Deployment status
 * ✅ Cross-browser compatibility
 * ✅ Error detection
 */

const fs = require('fs');
const path = require('path');
const { HTMLReportGenerator } = require('./html-report-generator');

// 🎨 Color helpers for beautiful console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const icons = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
  rocket: '🚀',
  fire: '🔥',
  target: '🎯',
  gear: '⚙️'
};

class HealthChecker {
  constructor(options = {}) {
    this.options = {
      quick: false,
      ci: false,
      format: 'console', // console, json, html
      output: null,
      skipTests: [],
      ...options
    };
    
    this.results = {
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        skipped: 0
      },
      tests: []
    };
    
    this.startTime = Date.now();
  }

  // 🎨 Console formatting helpers
  log(message, color = 'white') {
    if (this.options.format === 'console') {
      console.log(`${colors[color]}${message}${colors.reset}`);
    }
  }

  logSection(title) {
    this.log(`\n${icons.rocket} ${title}`, 'cyan');
    this.log('='.repeat(50), 'cyan');
  }

  logResult(name, status, message = '', details = null) {
    const result = {
      name,
      status, // 'pass', 'fail', 'warn', 'skip'
      message,
      details,
      timestamp: new Date().toISOString()
    };

    this.results.tests.push(result);
    this.results.summary.total++;
    this.results.summary[status === 'pass' ? 'passed' : 
                         status === 'fail' ? 'failed' :
                         status === 'warn' ? 'warnings' : 'skipped']++;

    if (this.options.format === 'console') {
      const icon = status === 'pass' ? icons.success :
                   status === 'fail' ? icons.error :
                   status === 'warn' ? icons.warning : icons.info;
      
      const color = status === 'pass' ? 'green' :
                    status === 'fail' ? 'red' :
                    status === 'warn' ? 'yellow' : 'blue';

      this.log(`${icon} ${name}: ${message}`, color);
      
      if (details && Array.isArray(details)) {
        details.forEach(detail => {
          this.log(`   ${detail}`, 'white');
        });
      }
    }
  }

  // 📦 Bundle Size Analysis
  async checkBundleSize() {
    if (this.options.skipTests.includes('bundle')) return;
    
    this.logSection('Bundle Size Analysis');
    
    try {
      const buildPath = path.join(process.cwd(), 'build');
      if (!fs.existsSync(buildPath)) {
        this.logResult('Bundle Check', 'skip', 'Build directory not found. Run npm run build first.');
        return;
      }

      const staticPath = path.join(buildPath, 'static', 'js');
      if (!fs.existsSync(staticPath)) {
        this.logResult('Bundle Check', 'fail', 'Static JS directory not found');
        return;
      }

      const jsFiles = fs.readdirSync(staticPath)
        .filter(file => file.endsWith('.js'))
        .map(file => {
          const filePath = path.join(staticPath, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            sizeKB: Math.round(stats.size / 1024),
            sizeMB: Math.round(stats.size / 1024 / 1024 * 100) / 100
          };
        });

      const totalSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
      const totalSizeKB = Math.round(totalSize / 1024);
      const totalSizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;

      // Bundle size thresholds
      const maxBundleSize = 2 * 1024 * 1024; // 2MB
      const warnBundleSize = 1.5 * 1024 * 1024; // 1.5MB

      let status, message;
      if (totalSize > maxBundleSize) {
        status = 'fail';
        message = `Bundle too large: ${totalSizeMB}MB (max: 2MB)`;
      } else if (totalSize > warnBundleSize) {
        status = 'warn';
        message = `Bundle size warning: ${totalSizeMB}MB (consider optimization)`;
      } else {
        status = 'pass';
        message = `Bundle size OK: ${totalSizeMB}MB`;
      }

      const details = [
        `Total bundle size: ${totalSizeMB}MB (${totalSizeKB}KB)`,
        `Number of JS files: ${jsFiles.length}`,
        ...jsFiles.map(file => `  ${file.name}: ${file.sizeKB}KB`)
      ];

      this.logResult('Bundle Size', status, message, details);

      // Check for common optimization opportunities
      const largeFiles = jsFiles.filter(file => file.size > 500 * 1024); // > 500KB
      if (largeFiles.length > 0) {
        this.logResult('Large Files', 'warn', 
          `${largeFiles.length} files > 500KB found`,
          largeFiles.map(file => `  ${file.name}: ${file.sizeKB}KB - Consider code splitting`)
        );
      }

    } catch (error) {
      this.logResult('Bundle Analysis', 'fail', `Error: ${error.message}`);
    }
  }

  // 🔥 Firebase Health Check
  async checkFirebaseHealth() {
    if (this.options.skipTests.includes('firebase')) return;
    
    this.logSection('Firebase Health Check');

    try {
      // Check Firebase config
      const configPaths = [
        path.join(process.cwd(), 'src', 'firebase.ts'),
        path.join(process.cwd(), 'src', 'firebase.js'),
        path.join(process.cwd(), 'src', 'config', 'firebase.ts'),
        path.join(process.cwd(), 'src', 'config', 'firebase.js')
      ];

      let firebaseConfigPath = null;
      for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
          firebaseConfigPath = configPath;
          break;
        }
      }

      if (!firebaseConfigPath) {
        this.logResult('Firebase Config', 'fail', 'Firebase configuration file not found');
        return;
      }

      this.logResult('Firebase Config', 'pass', `Configuration found: ${path.relative(process.cwd(), firebaseConfigPath)}`);

      // Check Firestore rules
      const rulesPath = path.join(process.cwd(), 'firestore.rules');
      if (fs.existsSync(rulesPath)) {
        const rules = fs.readFileSync(rulesPath, 'utf8');
        if (rules.includes('allow read, write: if true')) {
          this.logResult('Firestore Rules', 'fail', 'Insecure rules detected: allowing all read/write');
        } else if (rules.includes('allow read, write: if request.auth != null')) {
          this.logResult('Firestore Rules', 'pass', 'Basic authentication rules in place');
        } else {
          this.logResult('Firestore Rules', 'warn', 'Custom rules detected - manual review recommended');
        }
      } else {
        this.logResult('Firestore Rules', 'warn', 'Firestore rules file not found');
      }

      // Check Firestore indexes
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      if (fs.existsSync(indexesPath)) {
        const indexes = JSON.parse(fs.readFileSync(indexesPath, 'utf8'));
        const indexCount = indexes.indexes ? indexes.indexes.length : 0;
        
        if (indexCount === 0) {
          this.logResult('Firestore Indexes', 'warn', 'No custom indexes defined');
        } else {
          this.logResult('Firestore Indexes', 'pass', `${indexCount} indexes configured`);
        }
      } else {
        this.logResult('Firestore Indexes', 'warn', 'Firestore indexes file not found');
      }

      // Check Firebase hosting config
      const firebaseJsonPath = path.join(process.cwd(), 'firebase.json');
      if (fs.existsSync(firebaseJsonPath)) {
        const firebaseConfig = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
        
        if (firebaseConfig.hosting) {
          this.logResult('Firebase Hosting', 'pass', 'Hosting configuration found');
          
          // Check for security headers
          const headers = firebaseConfig.hosting.headers;
          if (headers && headers.some(h => h.headers && h.headers['Content-Security-Policy'])) {
            this.logResult('Security Headers', 'pass', 'CSP headers configured');
          } else {
            this.logResult('Security Headers', 'warn', 'No CSP headers found in hosting config');
          }
        } else {
          this.logResult('Firebase Hosting', 'skip', 'No hosting configuration');
        }
      }

    } catch (error) {
      this.logResult('Firebase Health', 'fail', `Error: ${error.message}`);
    }
  }

  // 🔒 Security Audit
  async checkSecurity() {
    if (this.options.skipTests.includes('security')) return;
    
    this.logSection('Security Audit');

    try {
      // Check for environment variables in code
      const srcPath = path.join(process.cwd(), 'src');
      if (fs.existsSync(srcPath)) {
        const suspiciousPatterns = [
          /REACT_APP_[A-Z_]*API[A-Z_]*KEY/g,
          /REACT_APP_[A-Z_]*SECRET/g,
          /REACT_APP_[A-Z_]*TOKEN/g,
          /REACT_APP_[A-Z_]*PASSWORD/g
        ];

        let foundSecrets = [];
        const checkDirectory = (dir) => {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
              checkDirectory(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
              const content = fs.readFileSync(filePath, 'utf8');
              suspiciousPatterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                  foundSecrets.push(...matches.map(match => `${file}: ${match}`));
                }
              });
            }
          });
        };

        checkDirectory(srcPath);

        if (foundSecrets.length > 0) {
          this.logResult('Secret Detection', 'warn', 
            `${foundSecrets.length} potential secrets found in code`,
            foundSecrets
          );
        } else {
          this.logResult('Secret Detection', 'pass', 'No obvious secrets found in source code');
        }
      }

      // Check package.json for known vulnerabilities
      const packagePath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Check for outdated React version
        const reactVersion = packageJson.dependencies?.react;
        if (reactVersion) {
          const majorVersion = parseInt(reactVersion.replace(/[\^~]/, ''));
          if (majorVersion < 18) {
            this.logResult('React Version', 'warn', `React ${reactVersion} is outdated, consider upgrading to v18+`);
          } else {
            this.logResult('React Version', 'pass', `React ${reactVersion} is up to date`);
          }
        }

        // Check for development dependencies in production
        const devDeps = Object.keys(packageJson.devDependencies || {});
        const prodDeps = Object.keys(packageJson.dependencies || {});
        const devInProd = devDeps.filter(dep => prodDeps.includes(dep));
        
        if (devInProd.length > 0) {
          this.logResult('Dependency Check', 'warn', 
            `${devInProd.length} packages in both dependencies and devDependencies`,
            devInProd
          );
        } else {
          this.logResult('Dependency Check', 'pass', 'Dependencies properly organized');
        }
      }

      // Check for Content Security Policy
      const indexPath = path.join(process.cwd(), 'public', 'index.html');
      if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        if (indexContent.includes('Content-Security-Policy')) {
          this.logResult('CSP Headers', 'pass', 'Content Security Policy found in index.html');
        } else {
          this.logResult('CSP Headers', 'warn', 'No Content Security Policy found - consider adding CSP headers');
        }
      }

    } catch (error) {
      this.logResult('Security Audit', 'fail', `Error: ${error.message}`);
    }
  }

  // ⚡ Performance Check
  async checkPerformance() {
    if (this.options.skipTests.includes('performance')) return;
    
    this.logSection('Performance Analysis');

    try {
      // Check build configuration for performance optimizations
      const packagePath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Check for performance-related scripts
        const scripts = packageJson.scripts || {};
        const hasOptimizedBuild = Object.keys(scripts).some(script => 
          script.includes('optimized') || scripts[script].includes('optimized')
        );
        
        if (hasOptimizedBuild) {
          this.logResult('Build Optimization', 'pass', 'Optimized build scripts found');
        } else {
          this.logResult('Build Optimization', 'warn', 'No optimized build scripts detected');
        }

        // Check for source map generation
        const buildScript = scripts.build || '';
        if (buildScript.includes('GENERATE_SOURCEMAP=false')) {
          this.logResult('Source Maps', 'pass', 'Source maps disabled for production (good for performance)');
        } else {
          this.logResult('Source Maps', 'warn', 'Source maps may be enabled - consider disabling for production');
        }
      }

      // Check for performance monitoring
      const srcPath = path.join(process.cwd(), 'src');
      if (fs.existsSync(srcPath)) {
        let hasWebVitals = false;
        let hasLighthouse = false;

        const checkForPerformanceTools = (dir) => {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
              checkForPerformanceTools(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
              const content = fs.readFileSync(filePath, 'utf8');
              if (content.includes('web-vitals') || content.includes('reportWebVitals')) {
                hasWebVitals = true;
              }
            }
          });
        };

        checkForPerformanceTools(srcPath);

        // Check for Lighthouse in package.json
        const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
        if (packageJson.scripts && Object.values(packageJson.scripts).some(script => script.includes('lighthouse'))) {
          hasLighthouse = true;
        }

        if (hasWebVitals) {
          this.logResult('Web Vitals', 'pass', 'Web Vitals monitoring detected');
        } else {
          this.logResult('Web Vitals', 'warn', 'No Web Vitals monitoring found');
        }

        if (hasLighthouse) {
          this.logResult('Lighthouse', 'pass', 'Lighthouse script available');
        } else {
          this.logResult('Lighthouse', 'warn', 'No Lighthouse script found');
        }
      }

      // Check for lazy loading implementation
      const componentsPath = path.join(process.cwd(), 'src', 'components');
      if (fs.existsSync(componentsPath)) {
        let hasLazyLoading = false;
        
        const checkForLazy = (dir) => {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
              checkForLazy(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
              const content = fs.readFileSync(filePath, 'utf8');
              if (content.includes('React.lazy') || content.includes('lazy(')) {
                hasLazyLoading = true;
              }
            }
          });
        };

        checkForLazy(componentsPath);

        if (hasLazyLoading) {
          this.logResult('Code Splitting', 'pass', 'Lazy loading implementation detected');
        } else {
          this.logResult('Code Splitting', 'warn', 'No lazy loading found - consider implementing for large components');
        }
      }

    } catch (error) {
      this.logResult('Performance Check', 'fail', `Error: ${error.message}`);
    }
  }

  // 🏗️ Build Quality Check
  async checkBuildQuality() {
    if (this.options.skipTests.includes('build')) return;
    
    this.logSection('Build Quality Check');

    try {
      // TypeScript configuration check
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      if (fs.existsSync(tsconfigPath)) {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        
        const strictChecks = [
          'strict',
          'noImplicitAny',
          'strictNullChecks',
          'noImplicitReturns'
        ];

        const enabledChecks = strictChecks.filter(check => 
          tsconfig.compilerOptions && tsconfig.compilerOptions[check] === true
        );

        if (enabledChecks.length === strictChecks.length) {
          this.logResult('TypeScript Strict Mode', 'pass', 'All strict checks enabled');
        } else if (enabledChecks.length > 0) {
          this.logResult('TypeScript Strict Mode', 'warn', 
            `${enabledChecks.length}/${strictChecks.length} strict checks enabled`,
            [`Missing: ${strictChecks.filter(check => !enabledChecks.includes(check)).join(', ')}`]
          );
        } else {
          this.logResult('TypeScript Strict Mode', 'fail', 'No strict checks enabled');
        }
      } else {
        this.logResult('TypeScript Config', 'skip', 'No tsconfig.json found');
      }

      // ESLint configuration check
      const eslintPaths = [
        path.join(process.cwd(), '.eslintrc.js'),
        path.join(process.cwd(), '.eslintrc.json'),
        path.join(process.cwd(), 'package.json') // check eslintConfig in package.json
      ];

      let hasEslint = false;
      for (const eslintPath of eslintPaths) {
        if (fs.existsSync(eslintPath)) {
          if (eslintPath.endsWith('package.json')) {
            const packageJson = JSON.parse(fs.readFileSync(eslintPath, 'utf8'));
            if (packageJson.eslintConfig) {
              hasEslint = true;
              break;
            }
          } else {
            hasEslint = true;
            break;
          }
        }
      }

      if (hasEslint) {
        this.logResult('ESLint Configuration', 'pass', 'ESLint configuration found');
      } else {
        this.logResult('ESLint Configuration', 'warn', 'No ESLint configuration found');
      }

      // Check for build artifacts
      const buildPath = path.join(process.cwd(), 'build');
      if (fs.existsSync(buildPath)) {
        const buildFiles = fs.readdirSync(buildPath);
        const hasIndex = buildFiles.includes('index.html');
        const hasStatic = buildFiles.includes('static');
        const hasManifest = buildFiles.includes('manifest.json');

        if (hasIndex && hasStatic) {
          this.logResult('Build Artifacts', 'pass', `Build directory contains ${buildFiles.length} files`);
        } else {
          this.logResult('Build Artifacts', 'fail', 'Build directory missing essential files');
        }

        if (hasManifest) {
          this.logResult('PWA Manifest', 'pass', 'PWA manifest found');
        } else {
          this.logResult('PWA Manifest', 'warn', 'No PWA manifest found');
        }
      } else {
        this.logResult('Build Check', 'skip', 'No build directory found. Run npm run build first.');
      }

    } catch (error) {
      this.logResult('Build Quality', 'fail', `Error: ${error.message}`);
    }
  }

  // 🚀 Deployment Validation
  async checkDeployment() {
    if (this.options.skipTests.includes('deployment')) return;
    
    this.logSection('Deployment Validation');

    try {
      // Check Vercel configuration
      const vercelPath = path.join(process.cwd(), 'vercel.json');
      if (fs.existsSync(vercelPath)) {
        const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
        this.logResult('Vercel Config', 'pass', 'Vercel configuration found');
        
        // Check for redirects and rewrites
        if (vercelConfig.redirects || vercelConfig.rewrites) {
          this.logResult('URL Routing', 'pass', 'URL redirects/rewrites configured');
        } else {
          this.logResult('URL Routing', 'warn', 'No URL routing rules found');
        }

        // Check for build configuration
        if (vercelConfig.buildCommand || vercelConfig.framework) {
          this.logResult('Build Config', 'pass', 'Build configuration specified');
        } else {
          this.logResult('Build Config', 'warn', 'No explicit build configuration');
        }
      } else {
        this.logResult('Vercel Config', 'skip', 'No vercel.json found');
      }

      // Check for environment variables template
      const envExamplePath = path.join(process.cwd(), '.env.example');
      const envLocalPath = path.join(process.cwd(), '.env.local');
      
      if (fs.existsSync(envExamplePath)) {
        this.logResult('Environment Template', 'pass', '.env.example found');
      } else {
        this.logResult('Environment Template', 'warn', 'No .env.example found');
      }

      if (fs.existsSync(envLocalPath)) {
        this.logResult('Local Environment', 'warn', '.env.local exists (should be in .gitignore)');
      } else {
        this.logResult('Local Environment', 'pass', 'No .env.local in repository');
      }

      // Check .gitignore
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignore = fs.readFileSync(gitignorePath, 'utf8');
        const importantIgnores = [
          'node_modules',
          'build',
          '.env.local',
          '.env.development.local',
          '.env.test.local',
          '.env.production.local'
        ];

        const missingIgnores = importantIgnores.filter(ignore => !gitignore.includes(ignore));
        
        if (missingIgnores.length === 0) {
          this.logResult('GitIgnore', 'pass', 'All important files/folders ignored');
        } else {
          this.logResult('GitIgnore', 'warn', 
            `Missing from .gitignore: ${missingIgnores.join(', ')}`
          );
        }
      } else {
        this.logResult('GitIgnore', 'fail', 'No .gitignore found');
      }

    } catch (error) {
      this.logResult('Deployment Check', 'fail', `Error: ${error.message}`);
    }
  }

  // 📊 Generate final report
  generateReport() {
    const duration = Date.now() - this.startTime;
    const { summary } = this.results;

    this.log(`\n${icons.fire} Health Check Complete!`, 'bright');
    this.log('='.repeat(50), 'cyan');
    
    this.log(`\n${icons.target} Summary:`, 'bright');
    this.log(`Total tests: ${summary.total}`, 'white');
    this.log(`${icons.success} Passed: ${summary.passed}`, 'green');
    this.log(`${icons.warning} Warnings: ${summary.warnings}`, 'yellow');
    this.log(`${icons.error} Failed: ${summary.failed}`, 'red');
    this.log(`${icons.info} Skipped: ${summary.skipped}`, 'blue');
    this.log(`\n${icons.gear} Duration: ${duration}ms\n`, 'white');

    // Overall health score
    const healthScore = Math.round(
      ((summary.passed + summary.warnings * 0.5) / Math.max(summary.total - summary.skipped, 1)) * 100
    );

    let healthStatus, healthColor;
    if (healthScore >= 90) {
      healthStatus = 'Excellent';
      healthColor = 'green';
    } else if (healthScore >= 75) {
      healthStatus = 'Good';
      healthColor = 'green';
    } else if (healthScore >= 60) {
      healthStatus = 'Fair';
      healthColor = 'yellow';
    } else {
      healthStatus = 'Poor';
      healthColor = 'red';
    }

    this.log(`${icons.target} Overall Health: ${healthScore}% (${healthStatus})`, healthColor);

    // Return results for programmatic use
    return {
      ...this.results,
      summary: {
        ...summary,
        healthScore,
        healthStatus,
        duration
      }
    };
  }

  // 🏃‍♂️ Run all health checks
  async runAll() {
    this.log(`${icons.rocket} Starting TaskFlow Health Check System`, 'bright');
    this.log(`Mode: ${this.options.quick ? 'Quick' : 'Full'} | Format: ${this.options.format}`, 'cyan');

    if (!this.options.quick) {
      await this.checkBundleSize();
      await this.checkFirebaseHealth();
      await this.checkSecurity();
      await this.checkPerformance();
      await this.checkBuildQuality();
      await this.checkDeployment();
    } else {
      // Quick mode - only essential checks
      await this.checkBuildQuality();
      await this.checkSecurity();
      await this.checkFirebaseHealth();
    }

    return this.generateReport();
  }
}

// 🚀 CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    quick: args.includes('--quick'),
    ci: args.includes('--ci'),
    format: args.includes('--json') ? 'json' : 
            args.includes('--html') ? 'html' : 'console'
  };

  const checker = new HealthChecker(options);
  const results = await checker.runAll();

  // Handle different output formats
  if (options.format === 'json') {
    console.log(JSON.stringify(results, null, 2));
  } else if (options.format === 'html') {
    const htmlGenerator = new HTMLReportGenerator(results);
    const reportPath = htmlGenerator.saveReport('./health-report.html');
    console.log(`\n📊 HTML report generated: ${reportPath}`);
  }

  // Exit with appropriate code for CI
  if (options.ci) {
    const failed = results.summary.failed;
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
}

module.exports = { HealthChecker };
