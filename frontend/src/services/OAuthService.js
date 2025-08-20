/**
 * OAuthService - Service for handling OAuth authentication operations
 * Manages various OAuth providers and their configurations
 */
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  GithubAuthProvider,
} from 'firebase/auth';
import { auth } from './firebase';
import AuthService from './AuthService';

class OAuthService {
  constructor() {
    // Initialize providers
    this.providers = {
      google: new GoogleAuthProvider(),
      facebook: new FacebookAuthProvider(),
      microsoft: new OAuthProvider('microsoft.com'),
      apple: new OAuthProvider('apple.com'),
      github: new GithubAuthProvider(),
    };
    
    // Configure providers with additional scopes
    this.configureProviders();
  }
  
  /**
   * Configure OAuth providers with appropriate scopes and settings
   */
  configureProviders() {
    // Google scopes
    this.providers.google.addScope('profile');
    this.providers.google.addScope('email');
    
    // Facebook scopes
    this.providers.facebook.addScope('email');
    this.providers.facebook.addScope('public_profile');
    
    // Microsoft scopes
    this.providers.microsoft.addScope('openid');
    this.providers.microsoft.addScope('profile');
    this.providers.microsoft.addScope('email');
    this.providers.microsoft.setCustomParameters({
      prompt: 'select_account',
    });
    
    // Apple scopes
    this.providers.apple.addScope('email');
    this.providers.apple.addScope('name');
    
    // GitHub scopes
    this.providers.github.addScope('user');
    this.providers.github.addScope('read:user');
  }
  
  /**
   * Sign in with a specific OAuth provider
   * @param {string} providerName - The name of the provider (e.g., 'google')
   * @returns {Promise} Promise containing user credentials or error
   */
  async signInWithProvider(providerName) {
    try {
      // Check if provider exists
      if (!this.providers[providerName]) {
        throw new Error(`Provider '${providerName}' is not supported`);
      }
      
      // Check if we're in development mode
      const isDev = process.env.NODE_ENV === 'development';
      
      let result;
      
      if (isDev) {
        // In development, always simulate a successful login
        console.log(`[DEV] Simulating ${providerName} login`);
        
        // Create a mock user credential
        const mockUser = {
          uid: `mock-uid-${Date.now()}`,
          email: `mock-${providerName}-user@example.com`,
          displayName: `Mock ${providerName} User`,
          photoURL: null,
          getIdToken: async () => `mock-token-${Date.now()}`
        };
        
        result = {
          user: mockUser,
        };
      } else {
        // Use the provider to sign in
        const provider = this.providers[providerName];
        result = await signInWithPopup(auth, provider);
      }
      
      // Get the Firebase ID token
      const idToken = await result.user.getIdToken();
      
      // Track authentication event
      AuthService.trackAuthEvent(providerName, 'login', {
        success: true,
        userId: result.user.uid,
      });
      
      return {
        success: true,
        idToken,
        provider: providerName,
        user: result.user,
      };
    } catch (error) {
      console.error(`${providerName} login error:`, error);
      
      // Handle specific error cases
      let errorMessage = 'Authentication failed';
      
      // Popup closed by user isn't a critical error
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Authentication cancelled';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email address but different sign-in credentials';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'The authentication request was cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'The authentication popup was blocked by the browser';
      } else if (error.code === 'auth/invalid-api-key') {
        // This is common in development environments without proper Firebase setup
        console.warn('Invalid API key. If in development, try using mock authentication');
        errorMessage = 'Authentication service unavailable';
      }
      
      // Track authentication failure
      AuthService.trackAuthEvent(providerName, 'login_error', {
        success: false,
        errorCode: error.code,
        errorMessage,
      });
      
      return {
        success: false,
        error: errorMessage,
        errorCode: error.code,
      };
    }
  }
  
  /**
   * Check if a provider is supported on the current platform
   * @param {string} providerName - The name of the provider to check
   * @returns {boolean} Whether the provider is supported
   */
  isProviderSupported(providerName) {
    // Basic check for provider existence
    if (!this.providers[providerName]) {
      return false;
    }
    
    // Platform-specific checks for Apple Sign In
    // Apple Sign In is only available on Apple devices
    if (providerName === 'apple' && !/(Mac|iPhone|iPad|iPod)/i.test(navigator.userAgent)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get list of providers that are supported on the current platform
   * @returns {Array} Array of supported provider names
   */
  getSupportedProviders() {
    return Object.keys(this.providers).filter(provider => 
      this.isProviderSupported(provider)
    );
  }
}

export default new OAuthService();