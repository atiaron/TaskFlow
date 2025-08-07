#!/usr/bin/env node

/**
 * 🔥 Firebase Health Check
 * בדיקה מקיפה של תצורת Firebase
 */

const fs = require('fs');
const path = require('path');

class FirebaseChecker {
  constructor() {
    this.results = [];
  }

  log(message, type = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };

    console.log(`${colors[type]}${icons[type]} ${message}${colors.reset}`);
    this.results.push({ type, message, timestamp: new Date().toISOString() });
  }

  async checkFirebaseConfig() {
    this.log('🔥 Checking Firebase Configuration...', 'info');

    // בדיקת קובצי התצורה
    const configFiles = [
      'firebase.json',
      'firestore.rules',
      'firestore.indexes.json',
      '.firebaserc'
    ];

    configFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.log(`${file} found`, 'success');
        
        if (file === 'firebase.json') {
          this.checkFirebaseJson(filePath);
        } else if (file === 'firestore.rules') {
          this.checkFirestoreRules(filePath);
        } else if (file === 'firestore.indexes.json') {
          this.checkFirestoreIndexes(filePath);
        }
      } else {
        this.log(`${file} missing`, 'warning');
      }
    });
  }

  checkFirebaseJson(filePath) {
    try {
      const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // בדיקת Hosting
      if (config.hosting) {
        this.log('Firebase Hosting configured', 'success');
        
        // בדיקת Security Headers
        if (config.hosting.headers) {
          const hasCSP = config.hosting.headers.some(header => 
            header.headers && header.headers['Content-Security-Policy']
          );
          
          if (hasCSP) {
            this.log('Content Security Policy configured', 'success');
          } else {
            this.log('Missing Content Security Policy headers', 'warning');
          }
        } else {
          this.log('No security headers configured', 'warning');
        }

        // בדיקת Redirects/Rewrites
        if (config.hosting.rewrites) {
          this.log(`${config.hosting.rewrites.length} URL rewrites configured`, 'success');
        }
        
        if (config.hosting.redirects) {
          this.log(`${config.hosting.redirects.length} URL redirects configured`, 'success');
        }
      }

      // בדיקת Firestore
      if (config.firestore) {
        this.log('Firestore configured', 'success');
      } else {
        this.log('Firestore not configured', 'warning');
      }

      // בדיקת Functions
      if (config.functions) {
        this.log('Cloud Functions configured', 'success');
      }

      // בדיקת Storage
      if (config.storage) {
        this.log('Firebase Storage configured', 'success');
      }

    } catch (error) {
      this.log(`Error reading firebase.json: ${error.message}`, 'error');
    }
  }

  checkFirestoreRules(filePath) {
    try {
      const rules = fs.readFileSync(filePath, 'utf8');
      
      // בדיקות אבטחה
      if (rules.includes('allow read, write: if true')) {
        this.log('🚨 SECURITY RISK: Open read/write rules detected!', 'error');
      } else if (rules.includes('allow read, write: if request.auth != null')) {
        this.log('Basic authentication rules in place', 'success');
      } else {
        this.log('Custom security rules detected', 'info');
      }

      // בדיקת rules מתקדמות
      if (rules.includes('resource.data')) {
        this.log('Data validation rules found', 'success');
      }

      if (rules.includes('request.auth.uid')) {
        this.log('User-based access control found', 'success');
      }

      // ספירת rules
      const ruleCount = (rules.match(/allow/g) || []).length;
      this.log(`Total rules count: ${ruleCount}`, 'info');

    } catch (error) {
      this.log(`Error reading firestore.rules: ${error.message}`, 'error');
    }
  }

  checkFirestoreIndexes(filePath) {
    try {
      const indexes = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (indexes.indexes && indexes.indexes.length > 0) {
        this.log(`${indexes.indexes.length} Firestore indexes configured`, 'success');
        
        // ניתוח סוגי Indexes
        const compositeIndexes = indexes.indexes.filter(idx => idx.fields && idx.fields.length > 1);
        const singleFieldIndexes = indexes.indexes.filter(idx => idx.fields && idx.fields.length === 1);
        
        if (compositeIndexes.length > 0) {
          this.log(`${compositeIndexes.length} composite indexes found`, 'info');
        }
        
        if (singleFieldIndexes.length > 0) {
          this.log(`${singleFieldIndexes.length} single-field indexes found`, 'info');
        }

        // בדיקת collections
        const collections = [...new Set(indexes.indexes.map(idx => idx.collectionGroup))];
        this.log(`Indexes cover ${collections.length} collections: ${collections.join(', ')}`, 'info');
        
      } else {
        this.log('No custom indexes configured', 'warning');
      }

    } catch (error) {
      this.log(`Error reading firestore.indexes.json: ${error.message}`, 'error');
    }
  }

  async checkFirebaseSDK() {
    this.log('🔧 Checking Firebase SDK Configuration...', 'info');

    const configPaths = [
      'src/firebase.ts',
      'src/firebase.js',
      'src/config/firebase.ts',
      'src/config/firebase.js',
      'src/services/firebase.ts'
    ];

    let configFound = false;
    for (const configPath of configPaths) {
      const fullPath = path.join(process.cwd(), configPath);
      if (fs.existsSync(fullPath)) {
        configFound = true;
        this.log(`Firebase config found: ${configPath}`, 'success');
        
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // בדיקת Firebase services
          const services = [
            { name: 'Auth', patterns: ['getAuth', 'auth'] },
            { name: 'Firestore', patterns: ['getFirestore', 'firestore'] },
            { name: 'Storage', patterns: ['getStorage', 'storage'] },
            { name: 'Functions', patterns: ['getFunctions', 'functions'] },
            { name: 'Analytics', patterns: ['getAnalytics', 'analytics'] }
          ];

          services.forEach(service => {
            const hasService = service.patterns.some(pattern => content.includes(pattern));
            if (hasService) {
              this.log(`${service.name} service configured`, 'success');
            }
          });

          // בדיקת Environment Variables
          const envVars = content.match(/process\.env\.[A-Z_]+/g) || [];
          if (envVars.length > 0) {
            this.log(`${envVars.length} environment variables used`, 'info');
            
            // בדיקת משתני סביבה הכרחיים
            const requiredVars = [
              'REACT_APP_FIREBASE_API_KEY',
              'REACT_APP_FIREBASE_AUTH_DOMAIN',
              'REACT_APP_FIREBASE_PROJECT_ID'
            ];

            requiredVars.forEach(varName => {
              if (content.includes(varName)) {
                this.log(`Required env var ${varName} found`, 'success');
              } else {
                this.log(`Missing env var ${varName}`, 'warning');
              }
            });
          }

          // בדיקת Error Handling
          if (content.includes('try') && content.includes('catch')) {
            this.log('Error handling implemented', 'success');
          } else {
            this.log('No error handling found', 'warning');
          }

        } catch (error) {
          this.log(`Error reading ${configPath}: ${error.message}`, 'error');
        }
        break;
      }
    }

    if (!configFound) {
      this.log('No Firebase configuration file found!', 'error');
    }
  }

  async checkPackageJson() {
    this.log('📦 Checking Firebase Dependencies...', 'info');

    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.log('package.json not found', 'error');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // בדיקת Firebase dependencies
      if (deps.firebase) {
        this.log(`Firebase SDK version: ${deps.firebase}`, 'success');
        
        // בדיקת גרסה
        const version = deps.firebase.replace(/[\^~]/, '');
        const majorVersion = parseInt(version.split('.')[0]);
        
        if (majorVersion >= 10) {
          this.log('Firebase SDK is up to date (v10+)', 'success');
        } else if (majorVersion === 9) {
          this.log('Firebase SDK v9 - consider upgrading to v10+', 'warning');
        } else {
          this.log('Firebase SDK is outdated - upgrade recommended', 'error');
        }
      } else {
        this.log('Firebase SDK not found in dependencies', 'error');
      }

      // בדיקת Firebase tools
      if (deps['firebase-tools']) {
        this.log(`Firebase CLI tools: ${deps['firebase-tools']}`, 'success');
      } else {
        this.log('Firebase CLI tools not installed', 'warning');
      }

      // בדיקת related packages
      const relatedPackages = [
        'firebase-admin',
        '@firebase/app',
        '@firebase/auth',
        '@firebase/firestore'
      ];

      relatedPackages.forEach(pkg => {
        if (deps[pkg]) {
          this.log(`${pkg}: ${deps[pkg]}`, 'info');
        }
      });

    } catch (error) {
      this.log(`Error reading package.json: ${error.message}`, 'error');
    }
  }

  async checkEnvironmentFiles() {
    this.log('🌍 Checking Environment Configuration...', 'info');

    const envFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
      '.env.example'
    ];

    envFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.log(`${file} found`, 'success');
        
        if (file === '.env.example') {
          // בדיקת template
          const content = fs.readFileSync(filePath, 'utf8');
          const firebaseVars = content.split('\n').filter(line => 
            line.includes('FIREBASE') || line.includes('REACT_APP_FIREBASE')
          );
          this.log(`${firebaseVars.length} Firebase env vars in template`, 'info');
        }
      } else if (file === '.env.example') {
        this.log(`${file} missing - recommended for documentation`, 'warning');
      }
    });
  }

  async runAllChecks() {
    console.log('🔥 Firebase Health Check Starting...\n');
    
    await this.checkFirebaseConfig();
    await this.checkFirebaseSDK();
    await this.checkPackageJson();
    await this.checkEnvironmentFiles();

    // סיכום
    const errors = this.results.filter(r => r.type === 'error').length;
    const warnings = this.results.filter(r => r.type === 'warning').length;
    const successes = this.results.filter(r => r.type === 'success').length;

    console.log(`\n🎯 Firebase Health Check Summary:`);
    console.log(`✅ Successes: ${successes}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Errors: ${errors}`);

    if (errors === 0 && warnings === 0) {
      console.log('\n🔥 Firebase configuration is perfect! 🎉');
    } else if (errors === 0) {
      console.log('\n🟡 Firebase configuration is good with minor improvements needed');
    } else {
      console.log('\n🔴 Firebase configuration needs attention');
    }

    return { successes, warnings, errors, results: this.results };
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new FirebaseChecker();
  checker.runAllChecks().catch(error => {
    console.error('Firebase check failed:', error);
    process.exit(1);
  });
}

module.exports = { FirebaseChecker };
