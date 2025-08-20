/**
 * AuthService - Service for handling authentication operations
 * Manages API communication and token handling
 */
class AuthService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.endpoints = {
      login: '/auth/exchange',
      refresh: '/auth/refresh',
      verify: '/auth/verify-token',
      security: '/auth/security-status',
      sessions: '/auth/my-sessions',
    };
    
    // OAuth provider configuration
    this.oauthProviders = {
      google: {
        name: 'Google',
        color: '#4285F4',
        textColor: '#ffffff',
        icon: 'google',
      },
      facebook: {
        name: 'Facebook',
        color: '#1877F2',
        textColor: '#ffffff',
        icon: 'facebook',
      },
      microsoft: {
        name: 'Microsoft',
        color: '#2F2F2F',
        textColor: '#ffffff',
        icon: 'microsoft',
      },
      apple: {
        name: 'Apple',
        color: '#000000',
        textColor: '#ffffff',
        icon: 'apple',
      },
      github: {
        name: 'GitHub',
        color: '#24292e',
        textColor: '#ffffff',
        icon: 'github',
      },
    };
  }

  /**
   * Helper method for making authenticated API requests
   */
  async fetchWithAuth(endpoint, options = {}) {
    const token = localStorage.getItem('accessToken');
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401) {
          // Try to refresh the token if possible
          const refreshed = await this.refreshToken();
          if (refreshed.success) {
            // Retry the original request with the new token
            return this.fetchWithAuth(endpoint, options);
          }
        }
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Login with Firebase ID token
   * Exchanges Firebase token for JWT
   */
  async login(credentials) {
    try {
      const { idToken, provider } = credentials;
      
      const response = await fetch(`${this.baseUrl}${this.endpoints.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idToken,
          provider: provider || 'google', // Default to google if not specified
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Track the provider used for authentication
      if (data.user) {
        data.user.authProvider = provider || 'google';
      }
      
      return {
        success: true,
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        sessionInfo: {
          expiresInMs: data.expiresInMs,
          provider: provider || 'google',
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Failed to authenticate'
      };
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch(`${this.baseUrl}${this.endpoints.refresh}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }
      
      // Update the access token in localStorage
      localStorage.setItem('accessToken', data.accessToken);
      
      return {
        success: true,
        accessToken: data.accessToken,
        expiresInMs: data.expiresInMs
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear auth state on refresh failure
      this.clearAuthData();
      return {
        success: false,
        error: error.message || 'Failed to refresh token'
      };
    }
  }

  /**
   * Verify if the current token is valid
   */
  async verifyToken(token = null) {
    try {
      const tokenToVerify = token || localStorage.getItem('accessToken');
      
      if (!tokenToVerify) {
        return false;
      }
      
      const response = await fetch(`${this.baseUrl}${this.endpoints.verify}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenToVerify }),
      });
      
      const data = await response.json();
      return response.ok && data.valid;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  /**
   * Get security status information
   */
  async getSecurityStatus() {
    try {
      return await this.fetchWithAuth(this.endpoints.security);
    } catch (error) {
      console.error('Security status error:', error);
      throw error;
    }
  }

  /**
   * Get user's active sessions
   */
  async getActiveSessions() {
    try {
      return await this.fetchWithAuth(this.endpoints.sessions);
    } catch (error) {
      console.error('Get sessions error:', error);
      throw error;
    }
  }

  /**
   * Logout - clear local auth data
   * In a real app, this would also invalidate the token on the server
   */
  async logout() {
    // In a production app, we would call the server to invalidate the token
    // For now, just clear local storage
    this.clearAuthData();
    return { success: true };
  }

  /**
   * Clear all authentication data from local storage
   */
  clearAuthData() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Check if token needs to be refreshed (e.g., if it's close to expiring)
   */
  shouldRefreshToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    
    try {
      // Decode the JWT to check expiration
      // This is a simple implementation - in production you might want to use a JWT library
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      // Refresh if token expires in less than 5 minutes
      return expTime - currentTime < 5 * 60 * 1000;
    } catch (error) {
      console.error('Token parsing error:', error);
      return true; // Refresh on error to be safe
    }
  }
  
  /**
   * Decode the JWT token to extract user info and expiration time
   * @param {string} token - JWT token to decode
   * @returns {object} Decoded token payload or null if invalid
   */
  decodeToken(token) {
    if (!token) return null;
    
    try {
      // Split the token and decode the payload (middle part)
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      // Base64 decode and parse JSON
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }
  
  /**
   * Get token expiration time in milliseconds
   * @returns {number} Expiration time in milliseconds or 0 if no valid token
   */
  getTokenExpirationTime() {
    const token = this.getToken();
    if (!token) return 0;
    
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return 0;
    
    return decoded.exp * 1000; // Convert to milliseconds
  }
  
  /**
   * Check if token will expire soon (within the next 5 minutes)
   * @returns {boolean} True if token will expire soon
   */
  willTokenExpireSoon() {
    const expTime = this.getTokenExpirationTime();
    if (!expTime) return false;
    
    const currentTime = Date.now();
    const timeUntilExpiry = expTime - currentTime;
    
    // Return true if token expires in less than 5 minutes
    return timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000;
  }
  
  /**
   * Check if token is expired
   * @returns {boolean} True if token is expired
   */
  isTokenExpired() {
    const expTime = this.getTokenExpirationTime();
    if (!expTime) return true;
    
    return Date.now() > expTime;
  }

  /**
   * Get the current authentication token
   */
  getToken() {
    return localStorage.getItem('accessToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  }
  /**
   * Get available OAuth providers
   * @returns {Object} Configuration for all supported providers
   */
  getOAuthProviders() {
    return this.oauthProviders;
  }
  
  /**
   * Get configuration for a specific OAuth provider
   * @param {string} providerName - The name of the provider (e.g., 'google')
   * @returns {Object} Configuration for the specified provider
   */
  getOAuthProvider(providerName) {
    return this.oauthProviders[providerName] || null;
  }
  
  /**
   * Track user analytics for authentication
   * @param {string} provider - The OAuth provider used
   * @param {string} action - The action taken (login, logout, etc.)
   * @param {Object} details - Additional details to track
   */
  trackAuthEvent(provider, action, details = {}) {
    // In a real implementation, this would send data to an analytics service
    console.log(`Auth Event: ${action} with ${provider}`, details);
    // Example implementation could push to a service like Google Analytics, Mixpanel, etc.
  }
}

export default new AuthService();