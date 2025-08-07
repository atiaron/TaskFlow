/* cspell:disable */
import { User } from '../types';
import { auth } from '../config/firebase';
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

export class AuthService {
  private static listeners: ((user: User | null) => void)[] = [];
  private static provider = new GoogleAuthProvider();
  private static isInitialized = false;

  static async initializeGoogleAuth(): Promise<boolean> {
    console.log('🔍 AuthService.initializeGoogleAuth called (Firebase)');
    
    // Prevent multiple initializations
    if (this.isInitialized) {
      console.log('ℹ️ AuthService already initialized, skipping...');
      return true;
    }
    
    try {
      // Configure Google Auth Provider
      this.provider.addScope('email');
      this.provider.addScope('profile');
      
      // Handle redirect result if user came back from Google OAuth
      await this.handleRedirectResult();
      
      // Set up auth state listener (only once!)
      onAuthStateChanged(auth, (firebaseUser) => {
        console.log('🔄 Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
        if (firebaseUser) {
          const taskflowUser: User = this.convertFirebaseUserToTaskflowUser(firebaseUser);
          // שימוש בsessionStorage לטובת אבטחה מתקדמת
          sessionStorage.setItem('taskflow-user', JSON.stringify(taskflowUser));
          sessionStorage.setItem('taskflow-session', JSON.stringify({
            timestamp: new Date().toISOString(),
            userId: firebaseUser.uid,
            loginMethod: 'firebase',
            expiresAt: Date.now() + 3600000 // שעה
          }));
          this.notifyListeners(taskflowUser);
        } else {
          sessionStorage.removeItem('taskflow-user');
          sessionStorage.removeItem('taskflow-session');
          this.notifyListeners(null);
        }
      });

      this.isInitialized = true;
      console.log('✅ Firebase Auth is ready');
      return true;
    } catch (error) {
      console.error('❌ Firebase Auth initialization failed:', error);
      return false;
    }
  }

  static async handleRedirectResult(): Promise<void> {
    console.log('🔍 Checking for redirect result...');
    
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        console.log('✅ Google sign-in redirect successful:', result.user.email);
        // onAuthStateChanged will handle the rest
      } else {
        console.log('ℹ️ No redirect result found');
      }
    } catch (error: any) {
      console.error('❌ Error handling redirect result:', error);
      throw error;
    }
  }

  static async signInWithGoogle(): Promise<void> {
    console.log('🔍 AuthService.signInWithGoogle called (Firebase)');
    
    try {
      console.log('🚀 Starting Firebase Google sign in with redirect...');
      
      // Use redirect instead of popup to avoid Cross-Origin-Opener-Policy issues
      await signInWithRedirect(auth, this.provider);
      
      // The page will redirect and come back, so we don't get a result here
      console.log('🔄 Redirecting to Google sign in...');
      
    } catch (error: any) {
      console.error('❌ Firebase Google sign in failed:', error);
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
      // בדיקת תוקף הסשן
      const sessionStr = sessionStorage.getItem('taskflow-session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (Date.now() > session.expiresAt) {
          console.log('🔒 Session expired, removing user data');
          sessionStorage.removeItem('taskflow-user');
          sessionStorage.removeItem('taskflow-session');
          return null;
        }
      }
      
      const userStr = sessionStorage.getItem('taskflow-user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  private static convertFirebaseUserToTaskflowUser(firebaseUser: any): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      display_name: firebaseUser.displayName || firebaseUser.email || 'User',
      avatar_url: firebaseUser.photoURL || undefined,
      created_at: new Date(),
      last_active: new Date(),
      plan: 'free',
      settings: {
        theme: 'light',
        language: 'he',
        timezone: 'Asia/Jerusalem',
        notifications_enabled: true,
        email_notifications: true,
        push_notifications: true,
        ai_suggestions_enabled: true,
        auto_task_creation: false,
        confirmation_threshold: 75,
        privacy_mode: false,
        sensitive_data_encryption: true,
        cost_alerts: true,
        optimization_mode: false
      },
      preferences: {
        workingHours: {
          start: '09:00',
          end: '17:00'
        },
        timezone: 'Asia/Jerusalem',
        language: 'he',
        priorityPreferences: {
          autoHighPriority: ['דחוף', 'חשוב'],
          defaultPriority: 'medium',
          reminderDefaults: true
        },
        notificationSettings: {
          email: true,
          push: true,
          sms: false
        }
      },
      usage_stats: {
        messages_this_month: 0,
        tasks_created_this_month: 0,
        tasks_completed_this_month: 0,
        claude_api_calls: 0,
        estimated_monthly_cost: 0,
        actual_monthly_cost: 0,
        cost_breakdown: {
          claude_api: 0,
          firebase_storage: 0,
          firebase_operations: 0,
          other_services: 0,
          total: 0
        },
        completion_rate: 0,
        average_task_duration: 0,
        most_active_hours: [],
        streak_days: 0,
        most_used_features: [],
        ai_satisfaction_rating: 4,
        average_response_time: 0,
        error_rate: 0,
        uptime_percentage: 100
      }
    };
  }

  private static notifyListeners(user: User | null): void {
    this.listeners.forEach(listener => listener(user));
  }

  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      // ניקוי כל נתוני הסשן והטוקנים
      sessionStorage.removeItem('taskflow-user');
      sessionStorage.removeItem('taskflow-session');
      sessionStorage.removeItem('taskflow-access-token');
      sessionStorage.removeItem('taskflow-refresh-token');
      sessionStorage.removeItem('auth_token');
      // ניקוי נתונים רגישים מlocalStorage אם קיימים
      localStorage.removeItem('taskflow-user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('taskflow-access-token');
      localStorage.removeItem('taskflow-refresh-token');
      console.log('✅ Sign out successful - all session data and tokens cleared');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  // פונקציה חדשה לקבלת Access Token
  static getAccessToken(): string | null {
    return sessionStorage.getItem('taskflow-access-token');
  }

  // פונקציה חדשה לקבלת Refresh Token
  static getRefreshToken(): string | null {
    return sessionStorage.getItem('taskflow-refresh-token');
  }

  // פונקציה לבדיקת תוקף Token
  static isTokenExpired(): boolean {
    try {
      const sessionStr = sessionStorage.getItem('taskflow-session');
      if (!sessionStr) return true;
      
      const session = JSON.parse(sessionStr);
      return Date.now() > new Date(session.expiresAt).getTime();
    } catch {
      return true;
    }
  }

  // פונקציה לחידוש Token אוטומטי
  static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        console.log('❌ No refresh token available');
        return false;
      }

      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:4000' 
        : (process.env.REACT_APP_API_URL || 'https://taskflow-backend.vercel.app');

      const response = await fetch(`${apiUrl}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        console.log('❌ Token refresh failed');
        return false;
      }

      const data = await response.json();
      
      // עדכון Token חדש
      sessionStorage.setItem('taskflow-access-token', data.accessToken);
      
      // עדכון זמן תוקף
      const sessionStr = sessionStorage.getItem('taskflow-session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        session.expiresAt = data.expiresAt;
        sessionStorage.setItem('taskflow-session', JSON.stringify(session));
      }

      console.log('✅ Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    }
  }
}
