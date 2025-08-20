// Minimal focused Playwright mobile config (CommonJS form)
// Single project: iPhone SE, list reporter only, constrained test match
// NOTE: Keeping CommonJS to avoid needing "type": "module" change.
const { devices, defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: /taskflow-container-bound\.spec\.ts$/,
  timeout: 180_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  fullyParallel: false, // deterministic ordering for evidence capture
  retries: 0,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'iPhone SE',
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 }
      }
    }
  ],
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: true,
    timeout: 180_000
  }
});