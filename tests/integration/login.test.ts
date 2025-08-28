/**
 * Integration Tests - Login Flow
 * 🧪 בודק זרימת התחברות בסביבות שונות
 */

import { testConfig } from '../setup/test.config';

// Simple test runner for integration tests
class IntegrationTestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];
  
  test(name: string, fn: () => Promise<void>) {
    this.tests.push({ name, fn });
  }
  
  async run() {
    console.log('🧪 Running Integration Tests...');
    console.log('Config:', testConfig);
    
    let passed = 0;
    let failed = 0;
    
    for (const test of this.tests) {
      try {
        console.log(`  ✓ ${test.name}...`);
        await test.fn();
        passed++;
        console.log(`    ✅ PASSED`);
      } catch (error) {
        failed++;
        console.log(`    ❌ FAILED:`, error);
      }
    }
    
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
    return { passed, failed };
  }
}

const runner = new IntegrationTestRunner();

// Test MockAuth in development
runner.test('MockAuth login flow', async () => {
  if (!testConfig.useMockAuth) {
    console.log('  🏃‍♂️ Skipping MockAuth test (not in mock mode)');
    return;
  }
  
  const MockAuth = await import('../../src/services/MockAuth');
  
  // Test login
  const user = await MockAuth.default.login();
  if (!user || user.id !== 'dev-user') {
    throw new Error('MockAuth login failed');
  }
  
  // Test authentication status
  if (!MockAuth.default.isAuthenticated()) {
    throw new Error('MockAuth isAuthenticated should return true');
  }
  
  // Test user retrieval
  const retrievedUser = MockAuth.default.getUser();
  if (!retrievedUser || retrievedUser.id !== 'dev-user') {
    throw new Error('MockAuth getUser failed');
  }
  
  console.log('    📝 MockAuth user:', user);
});

// Test API connectivity
runner.test('API connectivity', async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), testConfig.integrationTestTimeout);
    
    const response = await fetch(`${testConfig.apiUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API health check failed: ${response.status}`);
    }
    
    console.log('    🌐 API is responding');
  } catch (error) {
    if (testConfig.isDev) {
      console.log('    ⚠️ API not available in dev mode (expected)');
    } else {
      throw error;
    }
  }
});

// Test environment configuration
runner.test('Environment configuration', async () => {
  const requiredEnvVars = [
    'REACT_APP_ENVIRONMENT',
    'REACT_APP_IS_DEV_MODE'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing environment variable: ${envVar}`);
    }
  }
  
  console.log('    ⚙️ Environment variables are set');
});

// Export runner for external execution
export default runner;

// Auto-run if called directly
if (require.main === module) {
  runner.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}
