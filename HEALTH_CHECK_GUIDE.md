# TaskFlow Automated Health Check System

A comprehensive automated health validation system for the TaskFlow application that validates all critical aspects in one go. This system can detect potential issues before they become problems and provides actionable recommendations.

## 🏥 Overview

The health check system performs automated validation across multiple areas:

- **Bundle Analysis**: Size, duplicates, unused dependencies, tree-shaking
- **Security Validation**: CSP headers, vulnerabilities, API key exposure, HTTPS
- **Performance Testing**: Page load times, Core Web Vitals, network requests
- **Firebase Health**: Connection, authentication, Firestore operations, indexes
- **Build Quality**: TypeScript errors, linting issues, test coverage
- **Deployment Status**: Vercel health, environment variables, CDN assets
- **Cross-browser Testing**: Basic compatibility checks
- **Error Detection**: Console errors, network failures, CSP violations

## 🚀 Quick Start

### Basic Usage

```bash
# Run complete health check
npm run health-check

# Quick check (skip deployment and browser tests)
npm run health-check:quick

# Security-focused check
npm run health-check:security

# Performance-focused check
npm run health-check:performance

# Production environment check
npm run health-check:production
```

### Advanced Usage

```bash
# Skip specific checks
node scripts/health-check.js --skip=firebase,deployment

# Custom environment
node scripts/health-check.js --env=production

# Verbose output
node scripts/health-check.js --verbose

# No report saving
node scripts/health-check.js --no-save
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run health-check` | Complete health check with all validations |
| `npm run health-check:quick` | Fast check skipping deployment and browser tests |
| `npm run health-check:security` | Security-focused validation |
| `npm run health-check:performance` | Performance-focused testing |
| `npm run health-check:production` | Production environment validation |

## 🔧 Configuration

### Main Configuration: `health-check.config.js`

```javascript
module.exports = {
  // Performance thresholds
  performance: {
    pageLoadTime: 3000, // ms
    bundleSize: {
      maxSize: 2 * 1024 * 1024, // 2MB
      warnSize: 1.5 * 1024 * 1024 // 1.5MB
    }
  },
  
  // Security settings
  security: {
    vulnerabilities: {
      maxCritical: 0,
      maxHigh: 2,
      maxMedium: 10
    }
  },
  
  // Firebase configuration
  firebase: {
    connection: { timeout: 10000 },
    auth: { testSignIn: true },
    firestore: { testWrite: true, testRead: true }
  }
};
```

### Runtime Configuration: `.health-checkrc`

```bash
# Skip specific checks
SKIP_CHECKS=deployment,browser

# Performance settings
LIGHTHOUSE_TIMEOUT=90000
BUNDLE_ANALYSIS=true

# Security settings
SECURITY_SCAN=true
CSP_CHECK=true

# Output settings
VERBOSE_OUTPUT=true
COLORED_OUTPUT=true
SAVE_REPORTS=true
```

## 📊 Understanding Results

### Health Score

- **80-100**: Excellent health - System running optimally
- **60-79**: Good health - Some areas for improvement
- **0-59**: Poor health - Critical issues need attention

### Check Categories

1. **Bundle Analysis** (4 sub-checks)
   - Bundle size validation
   - Duplicate dependency detection
   - Unused dependency scanning
   - Tree-shaking effectiveness

2. **Security Validation** (6 sub-checks)
   - Content Security Policy (CSP) headers
   - Security headers (HSTS, X-Frame-Options, etc.)
   - Vulnerability scanning with npm audit
   - API key exposure detection
   - HTTPS enforcement
   - Content security validation

3. **Performance Testing** (5 sub-checks)
   - Page load time measurement
   - Core Web Vitals analysis (FCP, LCP, FID, CLS, TBT)
   - Network request monitoring
   - Memory usage tracking
   - Bundle performance analysis

4. **Firebase Health** (4 sub-checks)
   - Connection testing
   - Authentication flow validation
   - Firestore operations (read/write)
   - Security rules validation

5. **Build Quality** (3 sub-checks)
   - TypeScript compilation
   - ESLint validation
   - Test coverage (if available)

6. **Deployment Validation** (3 sub-checks)
   - Deployment accessibility
   - Environment variables validation
   - CDN asset availability

## 📈 Reports

The system generates detailed reports in multiple formats:

### JSON Reports
- Machine-readable format for CI/CD integration
- Saved to `reports/health-check-{timestamp}.json`
- Contains complete validation results and metrics

### HTML Reports
- Visual dashboard with charts and recommendations
- Saved to `reports/health-check-{timestamp}.html`
- Interactive report with expandable sections

### Report Structure

```json
{
  "summary": {
    "startTime": "2025-08-07T08:30:00.000Z",
    "endTime": "2025-08-07T08:30:15.000Z",
    "duration": 15000,
    "totalChecks": 25,
    "passedChecks": 20,
    "failedChecks": 3,
    "warningChecks": 2,
    "criticalIssues": 1,
    "score": 80
  },
  "checks": [
    {
      "name": "bundle",
      "label": "Bundle Analysis",
      "success": true,
      "timestamp": "2025-08-07T08:30:05.000Z",
      "details": { /* detailed results */ },
      "warnings": [],
      "recommendations": []
    }
  ]
}
```

## 🔧 Integration

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Health Check
  run: npm run health-check:production
  
- name: Upload Health Report
  uses: actions/upload-artifact@v3
  with:
    name: health-report
    path: reports/
```

### Pre-deployment Hook

```json
{
  "scripts": {
    "pre-deploy": "npm run health-check:production",
    "deploy": "vercel --prod"
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Firebase Connection Timeout

```bash
# Skip Firebase checks if having connectivity issues
npm run health-check -- --skip=firebase
```

#### 2. Bundle Not Found

```bash
# Build the project first
npm run build
npm run health-check
```

#### 3. Dependencies Missing

```bash
# Install required dependencies
npm install --save-dev lighthouse chrome-launcher firebase-admin
```

#### 4. Lighthouse Fails

```bash
# Use simulated data if Chrome not available
PUPPETEER_SKIP_DOWNLOAD=true npm run health-check
```

### Debug Mode

```bash
# Enable debug output
node scripts/health-check.js --verbose

# Skip problematic checks
node scripts/health-check.js --skip=firebase,deployment,performance
```

## 🎯 Best Practices

### Regular Health Checks

1. **Development**: Run health check before major commits
2. **Pre-deployment**: Always run production health check
3. **Post-deployment**: Validate deployment health
4. **Monitoring**: Set up automated checks for production

### Performance Optimization

1. Monitor bundle size trends
2. Address Core Web Vitals issues
3. Optimize slow network requests
4. Review unused dependencies regularly

### Security Maintenance

1. Fix critical vulnerabilities immediately
2. Update dependencies regularly
3. Review and strengthen CSP policies
4. Monitor for API key exposure

### Firebase Best Practices

1. Optimize Firestore queries
2. Review security rules regularly
3. Monitor connection latency
4. Test authentication flows

## 📚 Advanced Configuration

### Custom Thresholds

```javascript
// health-check.config.js
module.exports = {
  performance: {
    pageLoadTime: 2000,        // Stricter requirement
    bundleSize: {
      maxSize: 1 * 1024 * 1024  // 1MB limit
    }
  },
  security: {
    vulnerabilities: {
      maxCritical: 0,
      maxHigh: 0              // Zero tolerance
    }
  }
};
```

### Environment-Specific Settings

```javascript
module.exports = {
  environment: {
    development: {
      baseUrl: 'http://localhost:3000',
      skipDeploymentChecks: true
    },
    staging: {
      baseUrl: 'https://staging.example.com',
      skipDeploymentChecks: false
    },
    production: {
      baseUrl: 'https://task-flow-lac-three.vercel.app',
      skipDeploymentChecks: false
    }
  }
};
```

### Notification Setup

```javascript
module.exports = {
  notifications: {
    slack: {
      enabled: true,
      webhook: process.env.SLACK_WEBHOOK_URL,
      criticalOnly: true
    },
    email: {
      enabled: true,
      recipients: ['admin@example.com'],
      criticalOnly: true
    }
  }
};
```

## 🤝 Contributing

To add new health checks:

1. Create new check module in `scripts/`
2. Follow the existing pattern for result structure
3. Add configuration options to `health-check.config.js`
4. Update documentation

### Check Module Template

```javascript
class CustomCheck {
  constructor(config) {
    this.config = config;
    this.results = {
      success: true,
      details: {},
      warnings: [],
      recommendations: []
    };
  }

  async run() {
    try {
      // Implement your check logic
      return this.results;
    } catch (error) {
      this.results.success = false;
      this.results.error = error.message;
      return this.results;
    }
  }
}

module.exports = CustomCheck;
```

## 📄 License

This health check system is part of the TaskFlow project and follows the same licensing terms.

## 🆘 Support

For issues or questions:

1. Check the troubleshooting section
2. Review the configuration files
3. Run with `--verbose` for detailed output
4. Create an issue in the repository