/* cspell:disable */
import { User } from '../types';
import MockAuth from './MockAuth';
import { AuthService as FirebaseAuthService } from './AuthService';
import AuthBridge from './authBridge';
import { api } from './http';
import syncService from './sync';

// Environment and mode configuration
const isDevelopment = process.env.NODE_ENV === 'development' || 
                    window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

// Auth mode configuration                    
const mode = (process.env.REACT_APP_AUTH_MODE || 'mock').toLowerCase();
const useMock = mode === 'mock';

console.log(`🎯 AuthProvider: Environment=${process.env.NODE_ENV}, isDevelopment=${isDevelopment}`);
console.log(`🎯 AuthProvider: Auth mode=${mode}, useMock=${useMock}`);

/**
 * AuthProvider - מערכת אותנטיקציה מאוחדת עם Auth Bridge
 * מחליפה בין MockAuth לפיתוח ו-FirebaseAuth+AuthBridge לפרודקשן
 */
class UnifiedAuthService {
  private useFirebase: boolean;
  private authBridgeUnsubscribe: (() => void) | null = null;

  constructor() {
    this.useFirebase = !useMock;
    console.log(`🔧 AuthProvider initialized - Using ${this.useFirebase ? 'Firebase+Bridge' : 'Mock'} Auth`);
    
    // Initialize Sync Service in Guest mode by default
    syncService.setMode(true);
  }

  // Guest Mode functions
  isGuestModeEnabled(): boolean {
    return process.env.REACT_APP_GUEST_MODE === '1';
  }

  isSyncOnLoginEnabled(): boolean {
    return process.env.REACT_APP_SYNC_ON_LOGIN === '1';
  }

  // Get current storage service
  getStorageService() {
    return syncService.getStore();
  }

  getAuthMode(): string {
    return this.useFirebase ? 'Firebase+AuthBridge' : 'MockAuth';
  }

  // פונקציות מאוחדות שמעבירות לשירות המתאים

  async initializeGoogleAuth(): Promise<boolean> {
    if (this.useFirebase) {
      // Initialize Firebase Auth first
      const success = await FirebaseAuthService.initializeGoogleAuth();
      if (success) {
        // Attach Auth Bridge to handle token exchange
        this.authBridgeUnsubscribe = AuthBridge.attachAuthBridge();
        console.log('✅ Firebase Auth + Auth Bridge initialized');
      }
      return success;
    } else {
      // MockAuth doesn't need initialization
      console.log('🔧 MockAuth: initializeGoogleAuth - skipping in dev mode');
      return await MockAuth.initializeGoogleAuth();
    }
  }

  async signInWithGoogle(): Promise<void> {
    if (this.useFirebase) {
      return await FirebaseAuthService.signInWithGoogle();
    } else {
      // במצב פיתוח, פשוט מחזיר משתמש מדומה
      const user = await MockAuth.login();
      console.log('🔧 MockAuth: Auto-login complete:', user);
    }
  }

  async signInWithMock(): Promise<void> {
    console.log('🔧 MockAuth: Manual login called');
    const user = await MockAuth.login();
    console.log('🔧 MockAuth: Manual login complete:', user);
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (this.useFirebase) {
      // Use Auth Bridge listener instead of direct Firebase
      return AuthBridge.onAuthStateChanged(callback);
    } else {
      // בdev mode - גם נרשום לMockAuth וגם נגרום לtoken exchange
      const mockUnsubscribe = MockAuth.onAuthStateChanged(async (user) => {
        try {
          if (user) {
            console.log('🔧 Dev mode: MockAuth user logged in, triggering token exchange...');
            
            // Sync on Login if enabled
            if (this.isSyncOnLoginEnabled()) {
              try {
                console.log('🔄 AuthProvider: Starting sync on login...');
                await syncService.mergeOnLogin(user.id);
                console.log('✅ AuthProvider: Sync on login completed');
              } catch (error) {
                console.error('❌ AuthProvider: Sync on login failed:', error);
              }
            } else {
              // Just switch to cloud mode without sync
              syncService.setMode(false, user.id);
            }
            
            // גרום לtoken exchange עם MockAuth token
            try {
              const mockToken = await MockAuth.getIdToken();
              console.log('🔧 Dev mode: Got mock token, calling exchange API...');
              
              // עשה token exchange עם הmock token באמצעות axios
              const response = await api.post('/auth/exchange', { 
                idToken: mockToken 
              });
              
              const { accessToken, refreshToken } = response.data;
              sessionStorage.setItem('tf-access-token', accessToken);
              sessionStorage.setItem('tf-refresh-token', refreshToken);
              console.log('✅ Dev mode: Token exchange successful');
            } catch (error) {
              console.error('❌ Dev mode: Token exchange error:', error);
            }
          } else {
            // User logged out - reset to guest mode
            console.log('🔄 AuthProvider: User logged out, resetting to guest mode...');
            await syncService.resetToGuestMode();
          }
          
          // קרא ל-callback המקורי
          callback(user);
        } catch (error) {
          console.error('❌ AuthProvider: Error in auth state change:', error);
          // Even on error, call callback to prevent infinite loading
          callback(user);
        }
      });
      
      // הפעל Auth Bridge גם בdev mode לrefresh logic
      this.authBridgeUnsubscribe = AuthBridge.attachAuthBridge();
      console.log('🔧 Dev mode: MockAuth + AuthBridge activated');
      
      return () => {
        mockUnsubscribe();
        if (this.authBridgeUnsubscribe) {
          this.authBridgeUnsubscribe();
          this.authBridgeUnsubscribe = null;
        }
      };
    }
  }

  getCurrentUser(): User | null {
    if (this.useFirebase) {
      return AuthBridge.getCurrentUser();
    } else {
      return MockAuth.getCurrentUser();
    }
  }

  async signOut(): Promise<void> {
    console.log('🔄 AuthProvider: Starting signOut...');
    
    // Reset to Guest mode first
    await syncService.resetToGuestMode();
    
    if (this.useFirebase) {
      await AuthBridge.signOut();
      // Cleanup Auth Bridge
      if (this.authBridgeUnsubscribe) {
        this.authBridgeUnsubscribe();
        this.authBridgeUnsubscribe = null;
      }
    } else {
      await MockAuth.signOut();
    }
    
    console.log('✅ AuthProvider: SignOut completed, Guest mode active');
  }

  getAccessToken(): string | null {
    if (this.useFirebase) {
      return sessionStorage.getItem('tf-access-token') || sessionStorage.getItem('tf-access');
    } else {
      return MockAuth.getCurrentUser()?.token || null;
    }
  }

  getRefreshToken(): string | null {
    if (this.useFirebase) {
      return sessionStorage.getItem('tf-refresh-token') || sessionStorage.getItem('tf-refresh');
    } else {
      return 'mock-refresh-token';
    }
  }

  isAuthenticated(): boolean {
    if (this.useFirebase) {
      return AuthBridge.isAuthenticated();
    } else {
      return MockAuth.isAuthenticated();
    }
  }

  // Helper methods for backward compatibility
  isTokenExpired(): boolean {
    // Simple check - in production you'd decode JWT
    const token = this.getAccessToken();
    return !token;
  }

  async refreshToken(): Promise<boolean> {
    if (this.useFirebase) {
      // The Auth Bridge interceptors handle this automatically
      return true;
    } else {
      // Mock always succeeds
      return true;
    }
  }

  // Test method for development
  testAuth(): void {
    if (process.env.NODE_ENV !== 'development') return;
    
    console.log('🧪 Auth Provider Test:');
    console.log('Mode:', this.getAuthMode());
    console.log('Is Authenticated:', this.isAuthenticated());
    console.log('Current User:', this.getCurrentUser());
    console.log('Access Token:', this.getAccessToken() ? 'Present' : 'Missing');
    console.log('Refresh Token:', this.getRefreshToken() ? 'Present' : 'Missing');
    
    if (this.useFirebase) {
      AuthBridge.testAuthBridge();
    }
  }
}

// Export single instance
const AuthProvider = new UnifiedAuthService();
export default AuthProvider;
