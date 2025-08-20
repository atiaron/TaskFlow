import { defineConfig } from '@playwright/test';

// Standard web config to run all e2e specs under tests/e2e
// Uses existing dev server on :3000 (react-scripts) and reuses if already up.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  retries: 0,
  fullyParallel: false,
  reporter: 'list',
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: process.env.TASKFLOW_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: true,
    timeout: 180_000
  }
});
