/**
 * E2E Tests - Login Flow with Playwright
 * 🎭 בדיקות end-to-end רק על staging/production
 */

import { testConfig } from '../setup/test.config';

// Playwright configuration
export const playwrightConfig = {
  use: {
    baseURL: testConfig.baseUrl,
    headless: testConfig.isCI,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  projects: testConfig.browsers.map(browser => ({
    name: browser,
    use: { browserName: browser }
  })),
  timeout: testConfig.e2eTestTimeout,
  retries: testConfig.retries,
  workers: testConfig.parallel
};

// E2E Test Suite
export class E2ETestSuite {
  private shouldRun(): boolean {
    if (!testConfig.runE2ETests) {
      console.log('🏃‍♂️ Skipping E2E tests (not enabled for this environment)');
      return false;
    }
    
    if (testConfig.isDev) {
      console.log('🏃‍♂️ Skipping E2E tests in development mode');
      return false;
    }
    
    return true;
  }

  async runLoginTests() {
    if (!this.shouldRun()) return;
    
    console.log('🎭 Running E2E Login Tests...');
    console.log('Base URL:', testConfig.baseUrl);
    console.log('Using real OAuth:', !testConfig.useMockAuth);
    
    // This would integrate with actual Playwright tests
    const testPlan = {
      'Login page loads': {
        url: '/login',
        expects: ['TaskFlow', 'התחבר עם Google']
      },
      'Google OAuth flow': {
        skip: testConfig.useMockAuth,
        reason: 'Mock auth enabled'
      },
      'Dashboard loads after login': {
        requires: 'authenticated',
        expects: ['משימות', 'צ\'אט']
      }
    };
    
    console.log('📋 Test Plan:', testPlan);
    return testPlan;
  }

  async runSmokeTests() {
    if (!testConfig.runSmokeTests) {
      console.log('🏃‍♂️ Skipping smoke tests');
      return;
    }
    
    console.log('💨 Running Smoke Tests...');
    
    const smokeTests = [
      { name: 'Homepage loads', url: '/' },
      { name: 'Login page loads', url: '/login' },
      { name: 'API health check', url: testConfig.apiUrl + '/health' }
    ];
    
    const results: Array<{
      name: string;
      url: string;
      status: 'passed' | 'failed' | 'error';
      code?: number;
      error?: any;
    }> = [];
    
    for (const test of smokeTests) {
      try {
        console.log(`  ✓ ${test.name}...`);
        const response = await fetch(test.url);
        
        if (response.ok) {
          console.log(`    ✅ PASSED (${response.status})`);
          results.push({ ...test, status: 'passed', code: response.status });
        } else {
          console.log(`    ❌ FAILED (${response.status})`);
          results.push({ ...test, status: 'failed', code: response.status });
        }
      } catch (error) {
        console.log(`    ❌ ERROR:`, error);
        results.push({ ...test, status: 'error', error });
      }
    }
    
    const passed = results.filter(r => r.status === 'passed').length;
    const total = results.length;
    
    console.log(`📊 Smoke Tests: ${passed}/${total} passed`);
    return results;
  }
}

// Playwright test definitions (pseudo-code for actual implementation)
export const playwrightTests = `
// This would be the actual Playwright test file
import { test, expect } from '@playwright/test';

test.describe('TaskFlow Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should show login page', async ({ page }) => {
    await expect(page.locator('h3')).toContainText('TaskFlow');
    await expect(page.locator('button')).toContainText('התחבר');
  });

  test('should show dev mode indicator in development', async ({ page }) => {
    if (process.env.NODE_ENV === 'development') {
      await expect(page.locator('[data-testid="dev-mode-alert"]')).toBeVisible();
    }
  });

  ${testConfig.useMockAuth ? `
  test('should handle mock login', async ({ page }) => {
    await page.click('button:has-text("התחבר")');
    await expect(page).toHaveURL('/app');
  });
  ` : `
  test('should handle Google OAuth', async ({ page }) => {
    await page.click('button:has-text("התחבר עם Google")');
    // OAuth flow would be tested here with real credentials in staging
  });
  `}
});
`;

const e2eTestSuite = new E2ETestSuite();
export default e2eTestSuite;
