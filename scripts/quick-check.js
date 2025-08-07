#!/usr/bin/env node

/**
 * ⚡ Quick Health Check
 * בדיקות מהירות וחיוניות בלבד
 */

const { HealthChecker } = require('./health-check');

async function quickCheck() {
  console.log('⚡ Running Quick Health Check...\n');
  
  const checker = new HealthChecker({
    quick: true,
    format: 'console'
  });

  // הפעלה מהירה עם בדיקות חיוניות בלבד
  const results = await checker.runAll();
  
  // סיכום מהיר
  const { summary } = results;
  const criticalIssues = summary.failed;
  
  if (criticalIssues === 0) {
    console.log('\n🎉 All critical checks passed! System is healthy.');
  } else {
    console.log(`\n🚨 Found ${criticalIssues} critical issues that need attention.`);
    process.exit(1);
  }
  
  return results;
}

if (require.main === module) {
  quickCheck().catch(error => {
    console.error('Quick check failed:', error);
    process.exit(1);
  });
}

module.exports = { quickCheck };
