import { api, setAuthTokens, clearAuthTokens } from './http';
import { auth } from '../config/firebase';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';
import { User } from '../types';

/**
 * Auth Bridge - מקשר בין Firebase Auth ל-JWT Backend
 */
export class AuthBridge {
  private static isInitialized = false;
  private static listeners: Array<(user: User | null) => void> = [];
  
  /**
   * התחברות ל-Auth Bridge - מקשיב ל-Firebase ומחליף tokens
   */
  static attachAuthBridge(): () => void {
    if (this.isInitialized) {
      console.log('ℹ️ Auth Bridge already initialized');
      return () => {}; // return empty unsubscribe
    }
    
    console.log('🔗 Initializing Auth Bridge...');
    this.isInitialized = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          console.log('👤 Firebase user signed out');
          clearAuthTokens();
          this.notifyListeners(null);
          return;
        }
        
        console.log(`🔄 Firebase user signed in: ${firebaseUser.email}`);
        console.log('🔄 Exchanging Firebase ID Token for JWT...');
        
        // קבלת ID Token מFirebase
        const idToken = await getIdToken(firebaseUser, true);
        
        // קריאה ל-Auth Bridge בbackend
        const response = await api.post('/auth/exchange', { idToken });
        const { accessToken, refreshToken, user } = response.data;
        
        // שמירת הtokens
        setAuthTokens(accessToken, refreshToken);
        
        console.log('✅ Auth Bridge: JWT tokens received and stored');
        
        // המרה לUser type של המערכת
        const taskflowUser: User = {
          id: user.userId,
          email: user.email,
          display_name: user.name || user.email?.split('@')[0] || 'User',
          avatar_url: firebaseUser.photoURL || undefined,
          created_at: new Date(),
          last_active: new Date(),
          plan: 'free' as const,
          token: accessToken, // לתאימות עם קוד קיים
          settings: {
            theme: 'light' as const,
            language: 'he' as const,
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
              defaultPriority: 'medium' as const,
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
            ai_satisfaction_rating: 0,
            average_response_time: 0,
            error_rate: 0,
            uptime_percentage: 100
          }
        };
        
        this.notifyListeners(taskflowUser);
        
      } catch (error: any) {
        console.error('❌ Auth Bridge error:', error.message);
        
        // אם נכשל, מנקה הכל
        clearAuthTokens();
        this.notifyListeners(null);
        
        // Log additional info in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Auth Bridge error details:', error);
        }
      }
    });
    
    return unsubscribe;
  }
  
  /**
   * הוספת listener לשינויי אימות
   */
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * התנתקות מהמערכת
   */
  static async signOut(): Promise<void> {
    try {
      console.log('👋 Signing out...');
      
      // ניקוי tokens מקומי
      clearAuthTokens();
      
      // התנתקות מFirebase
      await auth.signOut();
      
      // אופציונלי: הודעה לbackend על logout
      try {
        await api.post('/auth/logout');
      } catch (logoutError) {
        // לא קריטי אם נכשל
        console.warn('⚠️ Backend logout notification failed:', logoutError);
      }
      
      console.log('✅ Signed out successfully');
      
    } catch (error: any) {
      console.error('❌ Sign out error:', error.message);
      // גם אם נכשל, מנקה tokens מקומיים
      clearAuthTokens();
      throw error;
    }
  }
  
  /**
   * קבלת המשתמש הנוכחי
   */
  static getCurrentUser(): User | null {
    // בעתיד: אפשר לשמור את המשתמש הנוכחי כאן
    // כרגע נשתמש בsessionStorage
    try {
      const userStr = sessionStorage.getItem('taskflow-user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }
  
  /**
   * בדיקה האם המשתמש מחובר
   */
  static isAuthenticated(): boolean {
    const accessToken = sessionStorage.getItem('tf-access');
    const refreshToken = sessionStorage.getItem('tf-refresh');
    return !!(accessToken && refreshToken);
  }
  
  /**
   * הודעה לכל הlisteners על שינוי במשתמש
   */
  private static notifyListeners(user: User | null): void {
    // שמירה בsessionStorage לתאימות
    if (user) {
      sessionStorage.setItem('taskflow-user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('taskflow-user');
    }
    
    // הודעה לכל הlisteners
    this.listeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('❌ Auth listener error:', error);
      }
    });
  }
  
  /**
   * Test function לdevelopment
   */
  static testAuthBridge(): void {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Auth Bridge test only available in development');
      return;
    }
    
    console.log('🧪 Testing Auth Bridge...');
    console.log('Current user:', this.getCurrentUser());
    console.log('Is authenticated:', this.isAuthenticated());
    console.log('Access token:', sessionStorage.getItem('tf-access') ? 'Present' : 'Missing');
    console.log('Refresh token:', sessionStorage.getItem('tf-refresh') ? 'Present' : 'Missing');
  }
}

export default AuthBridge;
