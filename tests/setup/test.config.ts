/**
 * Test Configuration - Environment-aware testing setup
 * 🧪 מנהל בדיקות בצורה חכמה לפי הסביבה
 */

// Environment detection
const isCI = process.env.CI === 'true';
const isDev = process.env.NODE_ENV === 'development';
const isStaging = process.env.REACT_APP_ENVIRONMENT === 'staging';
const isProduction = process.env.REACT_APP_ENVIRONMENT === 'production';

export const testConfig = {
  // Environment flags
  isCI,
  isDev,
  isStaging,
  isProduction,
  
  // Test types to run
  runUnitTests: true, // Always run unit tests
  runIntegrationTests: isDev || isCI, // Dev + CI
  runE2ETests: isStaging || isCI, // Only staging + CI
  runSmokeTests: isProduction || isCI, // Prod + CI
  
  // Mock configurations
  useMockAuth: isDev || !isStaging,
  useMockFirebase: isDev || !isStaging,
  useMockClaude: isDev || !isStaging,
  
  // Test URLs
  baseUrl: isDev 
    ? 'http://localhost:3000'
    : isStaging 
    ? 'https://taskflow-staging.vercel.app'
    : 'https://taskflow-atiaron.vercel.app',
    
  apiUrl: isDev
    ? 'http://localhost:3333'
    : isStaging
    ? 'https://taskflow-backend-staging.vercel.app'
    : 'https://taskflow-backend.vercel.app',
    
  // Timeouts
  unitTestTimeout: 5000,
  integrationTestTimeout: 15000,
  e2eTestTimeout: 30000,
  smokeTestTimeout: 10000,
  
  // Retry configurations
  retries: isCI ? 2 : 0,
  
  // Browser configurations for E2E
  browsers: isDev ? ['chromium'] : ['chromium', 'firefox', 'webkit'],
  
  // Parallel execution
  parallel: isCI ? 4 : 2
};

export default testConfig;
