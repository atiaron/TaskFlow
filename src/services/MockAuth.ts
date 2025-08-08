import { User } from '../types';

// Check if auto-login is enabled
const autoLoginEnabled = process.env.REACT_APP_AUTO_LOGIN === '1';

let authStateTimer: ReturnType<typeof setTimeout> | null = null;
let currentUser: User | null = null;
let authStateCallbacks: Array<(user: User | null) => void> = [];

const MockAuth = {
  login: async (): Promise<User> => {
    console.log('🔧 MockAuth: login called');
    const mockUser: User = {
      id: 'dev-user',
      email: 'dev@taskflow.com',
      display_name: 'Dev Developer',
      avatar_url: undefined,
      created_at: new Date(),
      last_active: new Date(),
      plan: 'free',
      // הוספת טוקן כדי לתמוך ב-RealTimeSyncService
      token: 'mock-token-123',
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
    
    // עדכן global state
    currentUser = mockUser;
    
    // Store in sessionStorage for consistency
    sessionStorage.setItem('taskflow_user', JSON.stringify(mockUser));
    sessionStorage.setItem('taskflow-access-token', 'dev-token-123');
    sessionStorage.setItem('taskflow-refresh-token', 'dev-refresh-token-456');
    
    // הודע לכל הcallbacks
    authStateCallbacks.forEach(callback => callback(mockUser));
    
    return mockUser;
  },

  logout: async (): Promise<void> => {
    console.log('🔧 MockAuth: logout called');
    
    // נקה global state
    currentUser = null;
    
    // בטל timer אם רץ
    if (authStateTimer) {
      clearTimeout(authStateTimer);
      authStateTimer = null;
    }
    
    // נקה sessionStorage
    sessionStorage.removeItem('taskflow_user');
    sessionStorage.removeItem('taskflow-access-token');
    sessionStorage.removeItem('taskflow-refresh-token');
    sessionStorage.removeItem('tf-access-token');
    sessionStorage.removeItem('tf-refresh-token');
    sessionStorage.removeItem('tf-access');
    sessionStorage.removeItem('tf-refresh');
    
    // הודע לכל הcallbacks על logout
    authStateCallbacks.forEach(callback => callback(null));
  },

  getUser: (): User | null => {
    console.log('🔧 MockAuth: getUser called');
    return currentUser;
  },

  isAuthenticated: (): boolean => {
    console.log('🔧 MockAuth: isAuthenticated called');
    return currentUser !== null;
  },
  
  getCurrentUser: (): User | null => {
    console.log('🔧 MockAuth: getCurrentUser called');
    return currentUser;
  },
  
  // פונקציות נוספות שה-App צריך
  initializeGoogleAuth: async (): Promise<boolean> => {
    console.log('🔧 MockAuth: initializeGoogleAuth called - skipping in dev mode');
    return Promise.resolve(true);
  },

  signOut: async (): Promise<void> => {
    console.log('🔧 MockAuth: signOut called');
    await MockAuth.logout(); // השתמש בlogout פנימי
    return Promise.resolve();
  },

  getIdToken: async (forceRefresh?: boolean): Promise<string> => {
    console.log('🔧 MockAuth: getIdToken called, forceRefresh:', forceRefresh);
    return Promise.resolve('mock-id-token'); // קבוע לבייפס בserver
  },
  
  onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
    console.log('🔧 MockAuth: onAuthStateChanged called, auto-login:', autoLoginEnabled);
    
    // הוסף callback לרשימה
    authStateCallbacks.push(callback);
    
    // בטל timer קודם אם קיים
    if (authStateTimer) {
      clearTimeout(authStateTimer);
    }

    // במצב dev, נבדק אם יש משתמש שמור ונקרא ל-callback
    authStateTimer = setTimeout(() => {
      console.log('🔧 MockAuth: triggering auth state change');
      
      // בדוק אם יש משתמש ב-memory או ב-sessionStorage
      if (currentUser) {
        callback(currentUser);
      } else {
        const storedUser = sessionStorage.getItem('taskflow_user');
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
          callback(currentUser);
        } else if (autoLoginEnabled) {
          // רק אם auto-login מופעל, ניצור משתמש חדש
          console.log('🔧 MockAuth: Auto-login enabled, creating user');
          MockAuth.login().then(user => {
            callback(user);
          });
        } else {
          // אם auto-login כבוי, נשאר במצב Guest
          console.log('🔧 MockAuth: Auto-login disabled, staying in guest mode');
          callback(null);
        }
      }
    }, 1000); // עיכוב של שנייה    // return unsubscribe function
    return () => {
      console.log('🔧 MockAuth: auth listener unsubscribed');
      
      // הסר callback מהרשימה
      const index = authStateCallbacks.indexOf(callback);
      if (index > -1) {
        authStateCallbacks.splice(index, 1);
      }
      
      if (authStateTimer) {
        clearTimeout(authStateTimer);
        authStateTimer = null;
      }
    };
  }
};

export default MockAuth;
