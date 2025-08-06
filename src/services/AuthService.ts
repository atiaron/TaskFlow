/* cspell:disable */
import { User } from '../types';

export class AuthService {
  private static CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '696433036067-4u56akikgjkepv9sj78is0398kgfiu6s.apps.googleusercontent.com';
  private static listeners: ((user: User | null) => void)[] = [];

  static async initializeGoogleAuth(): Promise<boolean> {
    console.log('🔍 AuthService.initializeGoogleAuth called');
    console.log('🔑 CLIENT_ID:', this.CLIENT_ID);
    console.log('🌍 ALL ENV VARS:', {
      REACT_APP_GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      NODE_ENV: process.env.NODE_ENV,
      allKeys: Object.keys(process.env).filter(key => key.startsWith('REACT_APP'))
    });

    try {
      if (!this.CLIENT_ID || this.CLIENT_ID === '') {
        console.error('❌ Google Client ID not configured. Check .env.development file.');
        return false;
      }

      console.log('✅ Google OAuth is ready for redirect flow');
      return true;
    } catch (error) {
      console.error('❌ Google Auth initialization failed:', error);
      return false;
    }
  }

  static async signInWithGoogle(): Promise<void> {
    console.log('🔍 AuthService.signInWithGoogle called');
    
    try {
      if (!this.CLIENT_ID || this.CLIENT_ID === '') {
        throw new Error('Google Client ID not configured');
      }

      console.log('🚀 Starting Google OAuth redirect flow...');
      
      // Create authorization URL for port 3000
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', this.CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', 'http://localhost:3000');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'email profile openid');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('state', 'taskflow-auth');

      console.log('🔗 Auth URL:', authUrl.toString());
      
      // Redirect to Google Auth
      window.location.href = authUrl.toString();
      
    } catch (error: any) {
      console.error('❌ Google sign in failed:', error);
      throw error;
    }
  }

  static async handleOAuthCallback(code: string): Promise<void> {
    console.log('🔍 AuthService.handleOAuthCallback called');
    
    try {
      // Send code to backend for token exchange
      const response = await fetch('http://localhost:4000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend auth failed: ${response.status} ${errorText}`);
      }

      const { user, access_token } = await response.json();
      
      console.log('✅ Backend auth successful:', user.email);
      
      // Save user data
      const taskflowUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        settings: {
          theme: 'light',
          language: 'he',
          notifications: true
        }
      };

      localStorage.setItem('taskflow-user', JSON.stringify(taskflowUser));
      localStorage.setItem('auth_token', access_token);
      
      // Notify listeners
      this.notifyListeners(taskflowUser);
      
      console.log('🎯 OAuth callback processed successfully');
      
    } catch (error: any) {
      console.error('❌ OAuth callback failed:', error);
      throw error;
    }
  }

  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    
    const currentUser = this.getCurrentUser();
    callback(currentUser);
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  static getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('taskflow-user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  private static notifyListeners(user: User | null): void {
    this.listeners.forEach(listener => listener(user));
  }

  static signOut(): void {
    localStorage.removeItem('taskflow-user');
    localStorage.removeItem('auth_token');
    this.notifyListeners(null);
    window.location.reload();
  }
}
