/**
 * Unit Tests - Service Injection
 * 🧪 בודק שהservices נטענים נכון לפי הסביבה
 */

// Mock environment variables before imports
const mockEnv = (env: 'development' | 'production' | 'staging') => {
  // Mock process.env
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    NODE_ENV: env,
    REACT_APP_IS_DEV_MODE: env === 'development' ? 'true' : 'false',
    REACT_APP_ENVIRONMENT: env
  };
  
  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      hostname: env === 'development' ? 'localhost' : 'taskflow-atiaron.vercel.app'
    },
    writable: true
  });
  
  return originalEnv;
};

describe('Service Injection', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = process.env;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Detection Logic', () => {
    it('should detect development environment correctly', () => {
      mockEnv('development');
      
      const isDev = process.env.NODE_ENV === 'development' || 
                   process.env.REACT_APP_IS_DEV_MODE === 'true' ||
                   window.location.hostname === 'localhost';
      
      expect(isDev).toBe(true);
    });

    it('should detect production environment correctly', () => {
      mockEnv('production');
      
      const isDev = process.env.NODE_ENV === 'development' || 
                   process.env.REACT_APP_IS_DEV_MODE === 'true' ||
                   window.location.hostname === 'localhost';
      
      expect(isDev).toBe(false);
    });
  });

  describe('MockAuth Service', () => {
    it('should provide correct mock user data', async () => {
      // Test MockAuth directly
      const MockAuth = await import('../../src/services/MockAuth');
      
      const user = await MockAuth.default.login();
      expect(user).toEqual({
        id: 'dev-user',
        name: 'Dev דמו',
        email: 'dev@taskflow.com',
        token: 'dev-token-123',
        roles: ['admin']
      });
      
      expect(MockAuth.default.isAuthenticated()).toBe(true);
      expect(MockAuth.default.getUser()).toMatchObject({
        id: 'dev-user',
        name: 'Dev דמו'
      });
    });

    it('should not throw errors on logout', async () => {
      const MockAuth = await import('../../src/services/MockAuth');
      
      await expect(MockAuth.default.logout()).resolves.not.toThrow();
    });
  });

  describe('RealAuth Service', () => {
    it('should throw not implemented errors', async () => {
      const RealAuth = await import('../../src/services/RealAuth');
      
      await expect(RealAuth.default.login()).rejects.toThrow('RealAuth not implemented yet');
      await expect(RealAuth.default.logout()).rejects.toThrow('RealAuth not implemented yet');
      expect(() => RealAuth.default.getUser()).toThrow('RealAuth not implemented yet');
      expect(() => RealAuth.default.isAuthenticated()).toThrow('RealAuth not implemented yet');
    });
  });
});
