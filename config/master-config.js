/**
 * 🚀 Ultimate Testing & Quality Assurance System
 * Master Configuration File
 * 
 * Centralized configuration for all testing systems
 */

const path = require('path');

const config = {
  // 🎯 Core System Settings
  system: {
    name: 'Ultimate QA System',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    projectRoot: path.resolve(__dirname, '..'),
    reportsDir: path.resolve(__dirname, '../reports'),
    tempDir: path.resolve(__dirname, '../tmp'),
  },

  // 🔥 Testing Framework Configuration
  testing: {
    // Parallel execution settings
    parallel: {
      enabled: true,
      maxConcurrency: require('os').cpus().length,
      timeoutMultiplier: 1.5,
    },
    
    // Test selection and filtering
    selection: {
      smartSelection: true,
      impactAnalysis: true,
      skipUnchanged: true,
      prioritizeFailures: true,
    },
    
    // Retry and resilience settings
    resilience: {
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
      flakyTestThreshold: 0.8,
    },
    
    // Coverage thresholds
    coverage: {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
  },

  // 🛡️ Security Testing Configuration
  security: {
    enabled: true,
    owasp: {
      enabled: true,
      apiUrl: 'http://localhost:8080',
      timeout: 300000,
    },
    
    vulnerabilityScanning: {
      dependencies: true,
      code: true,
      infrastructure: true,
    },
    
    complianceChecks: {
      gdpr: true,
      wcag: true,
      pci: false,
    },
  },

  // ⚡ Performance Testing Configuration
  performance: {
    enabled: true,
    
    // Core Web Vitals thresholds
    webVitals: {
      lcp: 2500,      // Largest Contentful Paint (ms)
      fid: 100,       // First Input Delay (ms)
      cls: 0.1,       // Cumulative Layout Shift
      fcp: 1800,      // First Contentful Paint (ms)
      ttfb: 600,      // Time to First Byte (ms)
    },
    
    // Load testing settings
    loadTesting: {
      enabled: true,
      maxUsers: 1000,
      rampUpTime: '5m',
      duration: '10m',
    },
    
    // Performance budgets
    budgets: {
      javascript: '250kb',
      css: '50kb',
      images: '1mb',
      fonts: '100kb',
      total: '2mb',
    },
  },

  // 🤖 AI-Powered Quality Assistant Configuration
  ai: {
    enabled: true,
    
    claudeApi: {
      enabled: true,
      endpoint: process.env.CLAUDE_API_ENDPOINT || 'http://localhost:3001',
      timeout: 30000,
    },
    
    features: {
      codeAnalysis: true,
      testSuggestion: true,
      bugPrediction: true,
      performanceOptimization: true,
      securityAnalysis: true,
    },
    
    learning: {
      enabled: true,
      modelPath: './models',
      updateFrequency: 'daily',
    },
  },

  // 📱 Cross-Platform Testing Configuration
  crossPlatform: {
    enabled: true,
    
    browsers: {
      chrome: { enabled: true, versions: ['latest', 'latest-1'] },
      firefox: { enabled: true, versions: ['latest', 'latest-1'] },
      safari: { enabled: true, versions: ['latest'] },
      edge: { enabled: true, versions: ['latest'] },
    },
    
    devices: {
      desktop: { enabled: true, resolutions: ['1920x1080', '1366x768'] },
      tablet: { enabled: true, resolutions: ['768x1024', '1024x768'] },
      mobile: { enabled: true, resolutions: ['375x667', '414x896'] },
    },
    
    networks: {
      enabled: true,
      conditions: ['fast3g', 'slow3g', 'offline'],
    },
  },

  // 📊 Reporting & Analytics Configuration
  reporting: {
    enabled: true,
    
    formats: ['html', 'json', 'xml', 'csv'],
    
    dashboard: {
      enabled: true,
      port: 3002,
      realtime: true,
      refreshInterval: 5000,
    },
    
    metrics: {
      quality: true,
      performance: true,
      security: true,
      coverage: true,
      trends: true,
    },
    
    storage: {
      type: 'file', // 'file' | 'database' | 'cloud'
      path: './reports/data',
      retention: '30d',
    },
  },

  // 🔔 Notification Configuration
  notifications: {
    enabled: true,
    
    channels: {
      console: { enabled: true, level: 'info' },
      file: { enabled: true, path: './logs/qa-system.log' },
      email: { 
        enabled: false,
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
      },
      slack: {
        enabled: false,
        webhook: process.env.SLACK_WEBHOOK_URL,
        channel: '#qa-alerts',
      },
      teams: {
        enabled: false,
        webhook: process.env.TEAMS_WEBHOOK_URL,
      },
    },
    
    triggers: {
      testFailure: ['console', 'file'],
      securityIssue: ['console', 'file', 'slack'],
      performanceDegradation: ['console', 'file'],
      systemError: ['console', 'file', 'slack'],
    },
  },

  // 🏗️ Infrastructure Configuration
  infrastructure: {
    enabled: true,
    
    docker: {
      enabled: true,
      registry: 'localhost:5000',
      namespace: 'taskflow-qa',
    },
    
    kubernetes: {
      enabled: false,
      namespace: 'qa-testing',
      maxPods: 10,
    },
    
    database: {
      type: 'sqlite',
      path: './data/qa-system.db',
      backup: true,
      backupInterval: '1h',
    },
  },

  // 🎮 Gamification & Team Collaboration
  collaboration: {
    enabled: true,
    
    teamMetrics: true,
    achievementSystem: true,
    leaderboards: true,
    
    testAssignment: {
      automatic: true,
      balancing: 'workload', // 'workload' | 'expertise' | 'random'
    },
    
    knowledgeSharing: {
      enabled: true,
      repository: './knowledge-base',
      autoCapture: true,
    },
  },

  // 🔮 Experimental Features
  experimental: {
    enabled: false,
    
    blockchain: {
      enabled: false,
      network: 'localhost',
      contract: null,
    },
    
    machineLearning: {
      enabled: true,
      frameworks: ['tensorflow'],
      models: {
        anomalyDetection: true,
        qualityPrediction: true,
        testOptimization: true,
      },
    },
  },
};

// 🎯 Environment-specific overrides
const environmentOverrides = {
  development: {
    testing: {
      parallel: { maxConcurrency: 2 },
      coverage: { statements: 70, branches: 65, functions: 70, lines: 70 },
    },
    notifications: {
      channels: {
        slack: { enabled: false },
        email: { enabled: false },
      },
    },
  },
  
  staging: {
    performance: {
      loadTesting: { maxUsers: 100, duration: '5m' },
    },
    notifications: {
      channels: {
        slack: { enabled: true },
      },
    },
  },
  
  production: {
    testing: {
      coverage: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
    security: {
      owasp: { enabled: true },
      vulnerabilityScanning: { dependencies: true, code: true, infrastructure: true },
    },
    notifications: {
      channels: {
        slack: { enabled: true },
        email: { enabled: true },
      },
    },
  },
};

// Apply environment-specific overrides
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      target[key] = target[key] || {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const finalConfig = deepMerge(
  JSON.parse(JSON.stringify(config)),
  environmentOverrides[config.system.environment] || {}
);

module.exports = finalConfig;