#!/usr/bin/env node

/**
 * 🤖 CI Health Check
 * מותאם לסביבות CI/CD עם פלטים מובנים
 */

const { HealthChecker } = require('./health-check');
const { FirebaseChecker } = require('./firebase-health');
const { SecurityAuditor } = require('./security-audit');

async function ciHealthCheck() {
  console.log('🤖 CI Health Check Starting...');
  
  const results = {
    overall: { passed: true, score: 100 },
    health: null,
    firebase: null,
    security: null,
    timestamp: new Date().toISOString()
  };

  try {
    // Health Check
    console.log('\n📋 Running Health Check...');
    const healthChecker = new HealthChecker({ 
      format: 'console',
      ci: true 
    });
    results.health = await healthChecker.runAll();
    
    // Firebase Check
    console.log('\n🔥 Running Firebase Check...');
    const firebaseChecker = new FirebaseChecker();
    results.firebase = await firebaseChecker.runAllChecks();
    
    // Security Audit
    console.log('\n🔒 Running Security Audit...');
    const securityAuditor = new SecurityAuditor();
    results.security = await securityAuditor.runSecurityAudit();
    
    // Calculate overall score
    const healthScore = results.health.summary?.healthScore || 0;
    const securityScore = results.security?.score || 0;
    const firebaseScore = results.firebase?.errors === 0 ? 100 : 
                          results.firebase?.errors < 3 ? 75 : 50;
    
    results.overall.score = Math.round((healthScore + securityScore + firebaseScore) / 3);
    
    // Determine if CI should fail
    const criticalIssues = (results.health.summary?.failed || 0) + 
                          (results.security?.critical || 0);
    
    if (criticalIssues > 0) {
      results.overall.passed = false;
    }
    
    // Generate CI summary
    console.log('\n🎯 CI Health Check Summary:');
    console.log(`Overall Score: ${results.overall.score}/100`);
    console.log(`Health: ${healthScore}/100`);
    console.log(`Security: ${securityScore}/100`);
    console.log(`Firebase: ${firebaseScore}/100`);
    console.log(`Critical Issues: ${criticalIssues}`);
    
    // Output for GitHub Actions
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::set-output name=health_score::${results.overall.score}`);
      console.log(`::set-output name=critical_issues::${criticalIssues}`);
      
      if (criticalIssues > 0) {
        console.log(`::error::Found ${criticalIssues} critical issues`);
      }
      
      // Create job summary
      const summary = generateGitHubSummary(results);
      console.log('::set-output name=summary::' + summary);
    }
    
    // Save detailed results
    const fs = require('fs');
    fs.writeFileSync('./ci-health-results.json', JSON.stringify(results, null, 2));
    
    // Exit with appropriate code
    process.exit(results.overall.passed ? 0 : 1);
    
  } catch (error) {
    console.error('CI Health Check failed:', error);
    process.exit(1);
  }
}

function generateGitHubSummary(results) {
  const { overall, health, security, firebase } = results;
  
  return `
## 🚀 TaskFlow Health Check Results

### Overall Score: ${overall.score}/100 ${overall.passed ? '✅' : '❌'}

| Category | Score | Status |
|----------|-------|--------|
| Health Check | ${health.summary?.healthScore || 0}/100 | ${health.summary?.failed === 0 ? '✅' : '❌'} |
| Security Audit | ${security?.score || 0}/100 | ${security?.critical === 0 ? '✅' : '❌'} |
| Firebase Config | ${firebase?.errors === 0 ? '100' : firebase?.errors < 3 ? '75' : '50'}/100 | ${firebase?.errors === 0 ? '✅' : '⚠️'} |

### Quick Stats
- ✅ Passed: ${(health.summary?.passed || 0) + (security?.passed || 0)}
- ⚠️ Warnings: ${(health.summary?.warnings || 0) + (security?.warnings || 0)}
- ❌ Critical: ${(health.summary?.failed || 0) + (security?.critical || 0)}

${overall.passed ? 
  '🎉 All critical checks passed! Ready for deployment.' : 
  '🚨 Critical issues found. Please review before deployment.'}
`;
}

if (require.main === module) {
  ciHealthCheck();
}

module.exports = { ciHealthCheck };
