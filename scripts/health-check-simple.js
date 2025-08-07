#!/usr/bin/env node

/**
 * Simple Health Check Test - TaskFlow
 * Basic version for testing the health check system
 */

const fs = require('fs');
const path = require('path');

class SimpleHealthCheck {
  constructor() {
    this.results = {
      summary: {
        startTime: new Date(),
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        warningChecks: 0,
        score: 0
      },
      checks: []
    };
  }

  async run() {
    console.log('🏥 TaskFlow Health Check System - Test Version\n');
    
    try {
      await this.checkBundleExists();
      await this.checkConfigFiles();
      await this.checkPackageJson();
      await this.generateSummary();
      
      process.exit(this.results.summary.failedChecks > 0 ? 1 : 0);
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      process.exit(1);
    }
  }

  async checkBundleExists() {
    console.log('📦 Checking build output...');
    
    const buildPath = path.join(process.cwd(), 'build');
    const result = {
      name: 'bundle',
      label: 'Bundle Analysis',
      success: fs.existsSync(buildPath),
      timestamp: new Date()
    };

    if (result.success) {
      console.log('✅ Build directory found');
      this.results.summary.passedChecks++;
    } else {
      console.log('❌ Build directory not found');
      this.results.summary.failedChecks++;
    }

    this.results.checks.push(result);
    this.results.summary.totalChecks++;
  }

  async checkConfigFiles() {
    console.log('\n🔧 Checking configuration files...');
    
    const configFiles = [
      'package.json',
      'firebase.json',
      'health-check.config.js',
      '.health-checkrc'
    ];

    let foundFiles = 0;
    
    for (const file of configFiles) {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      if (exists) {
        console.log(`✅ ${file} found`);
        foundFiles++;
      } else {
        console.log(`⚠️  ${file} not found`);
      }
    }

    const result = {
      name: 'config',
      label: 'Configuration Files',
      success: foundFiles >= 3,
      timestamp: new Date(),
      details: { foundFiles, totalFiles: configFiles.length }
    };

    if (result.success) {
      this.results.summary.passedChecks++;
    } else {
      this.results.summary.failedChecks++;
    }

    this.results.checks.push(result);
    this.results.summary.totalChecks++;
  }

  async checkPackageJson() {
    console.log('\n📋 Checking package.json scripts...');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      console.log('❌ package.json not found');
      return;
    }

    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = packageData.scripts || {};
    
    const requiredScripts = ['build', 'start', 'health-check'];
    let foundScripts = 0;

    for (const script of requiredScripts) {
      if (scripts[script]) {
        console.log(`✅ ${script} script found`);
        foundScripts++;
      } else {
        console.log(`❌ ${script} script missing`);
      }
    }

    const result = {
      name: 'scripts',
      label: 'Package Scripts',
      success: foundScripts === requiredScripts.length,
      timestamp: new Date(),
      details: { foundScripts, requiredScripts: requiredScripts.length }
    };

    if (result.success) {
      this.results.summary.passedChecks++;
    } else {
      this.results.summary.failedChecks++;
    }

    this.results.checks.push(result);
    this.results.summary.totalChecks++;
  }

  async generateSummary() {
    this.results.summary.endTime = new Date();
    this.results.summary.duration = this.results.summary.endTime - this.results.summary.startTime;
    
    const { totalChecks, passedChecks, failedChecks } = this.results.summary;
    this.results.summary.score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

    console.log('\n' + '='.repeat(50));
    console.log('📊 HEALTH CHECK SUMMARY');
    console.log('='.repeat(50));
    console.log(`⏱️  Duration: ${Math.round(this.results.summary.duration / 1000)}s`);
    console.log(`📊 Score: ${this.results.summary.score}/100`);
    console.log(`✅ Passed: ${passedChecks}`);
    console.log(`❌ Failed: ${failedChecks}`);
    console.log(`📊 Total: ${totalChecks}`);
    
    if (this.results.summary.score >= 80) {
      console.log('\n🎉 Excellent health! System is working properly.');
    } else if (this.results.summary.score >= 60) {
      console.log('\n⚠️  Good health with some areas for improvement.');
    } else {
      console.log('\n🚨 Poor health! Issues need attention.');
    }

    // Save simple JSON report
    const reportsDir = path.join(process.cwd(), 'reports');
    if (fs.existsSync(reportsDir)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `health-check-simple-${timestamp}.json`;
      const filepath = path.join(reportsDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
      console.log(`\n📄 Report saved: ${filepath}`);
    }
  }
}

// Run the health check
if (require.main === module) {
  const healthCheck = new SimpleHealthCheck();
  healthCheck.run();
}

module.exports = SimpleHealthCheck;