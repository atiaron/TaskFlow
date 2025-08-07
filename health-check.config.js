/**
 * Health Check Configuration for TaskFlow
 * Defines thresholds, URLs, and validation criteria
 */

module.exports = {
  // Environment Configuration
  environment: {
    development: {
      baseUrl: 'http://localhost:3000',
      firebaseEmulator: true,
      skipDeploymentChecks: true,
    },
    production: {
      baseUrl: 'https://task-flow-lac-three.vercel.app',
      firebaseEmulator: false,
      skipDeploymentChecks: false,
    }
  },

  // Performance Thresholds
  performance: {
    pageLoadTime: 3000, // ms
    firstContentfulPaint: 1500, // ms
    largestContentfulPaint: 2500, // ms
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 100, // ms
    totalBlockingTime: 200, // ms
    bundleSize: {
      maxSize: 2 * 1024 * 1024, // 2MB
      warnSize: 1.5 * 1024 * 1024, // 1.5MB
    },
    networkRequests: {
      maxCount: 50,
      maxFailureRate: 0.05, // 5%
    }
  },

  // Security Validation
  security: {
    csp: {
      required: true,
      allowUnsafeInline: false,
      allowUnsafeEval: false,
    },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    },
    vulnerabilities: {
      maxCritical: 0,
      maxHigh: 2,
      maxMedium: 10,
    }
  },

  // Firebase Health Checks
  firebase: {
    connection: {
      timeout: 10000, // ms
      retries: 3,
    },
    auth: {
      testSignIn: true,
      testSignOut: true,
    },
    firestore: {
      testRead: true,
      testWrite: true,
      checkIndexes: true,
      checkRules: true,
    },
    realtime: {
      testConnection: true,
      maxLatency: 1000, // ms
    }
  },

  // Build Quality
  build: {
    typescript: {
      allowErrors: false,
      maxWarnings: 10,
    },
    linting: {
      allowErrors: false,
      maxWarnings: 20,
    },
    testCoverage: {
      minCoverage: 70, // percentage
      requireTests: true,
    }
  },

  // Cross-browser Testing
  browsers: {
    chrome: { enabled: true, minVersion: '100' },
    firefox: { enabled: false, minVersion: '100' },
    safari: { enabled: false, minVersion: '14' },
    edge: { enabled: false, minVersion: '100' }
  },

  // Deployment Validation
  deployment: {
    vercel: {
      checkStatus: true,
      checkEnvironmentVars: true,
      requiredVars: [
        'REACT_APP_FIREBASE_API_KEY',
        'REACT_APP_FIREBASE_AUTH_DOMAIN',
        'REACT_APP_FIREBASE_PROJECT_ID'
      ]
    },
    cdn: {
      checkAssets: true,
      maxLoadTime: 2000, // ms
    }
  },

  // Notifications
  notifications: {
    slack: {
      enabled: false,
      webhook: process.env.SLACK_WEBHOOK_URL,
      criticalOnly: true,
    },
    email: {
      enabled: false,
      recipients: [],
      criticalOnly: true,
    }
  },

  // Reporting
  reporting: {
    outputDir: './reports',
    generateHtml: true,
    generateJson: true,
    historySize: 30, // keep last 30 reports
    timestampFormat: 'YYYY-MM-DD_HH-mm-ss',
  },

  // Error Detection
  errorDetection: {
    consoleErrors: {
      enabled: true,
      ignoreWarnings: true,
      maxErrors: 0,
    },
    networkFailures: {
      enabled: true,
      maxFailureRate: 0.05, // 5%
    },
    cspViolations: {
      enabled: true,
      maxViolations: 0,
    },
    memoryLeaks: {
      enabled: true,
      maxHeapIncrease: 50 * 1024 * 1024, // 50MB
    }
  },

  // Retry Configuration
  retries: {
    maxRetries: 3,
    retryDelay: 1000, // ms
    backoffMultiplier: 2,
  }
};