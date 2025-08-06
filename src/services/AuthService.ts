/* cspell:disable */
import { User } from '../types';
import { auth } from '../config/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

export class AuthService {
  private static listeners: ((user: User | null) => void)[] = [];
  private static provider = new GoogleAuthProvider();

  static async initializeGoogleAuth(): Promise<boolean> {
    console.log('🔍 AuthService.initializeGoogleAuth called (Firebase)');
    
    try {
      // Configure Google Auth Provider
      this.provider.addScope('email');
      this.provider.addScope('profile');
      
      // Set up auth state listener
      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const taskflowUser: User = this.convertFirebaseUserToTaskflowUser(firebaseUser);
          localStorage.setItem('taskflow-user', JSON.stringify(taskflowUser));
          this.notifyListeners(taskflowUser);
        } else {
          localStorage.removeItem('taskflow-user');
          this.notifyListeners(null);
        }
      });

      console.log('✅ Firebase Auth is ready');
      return true;
    } catch (error) {
      console.error('❌ Firebase Auth initialization failed:', error);
      return false;
    }
  }

  static async signInWithGoogle(): Promise<void> {
    console.log('🔍 AuthService.signInWithGoogle called (Firebase)');
    
    try {
      console.log('🚀 Starting Firebase Google sign in...');
      
      const result = await signInWithPopup(auth, this.provider);
      const user = result.user;
      
      console.log('✅ Firebase sign in successful:', user.email);
      
      // The auth state listener will handle the rest
      
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
      const userStr = localStorage.getItem('taskflow-user');
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
      localStorage.removeItem('taskflow-user');
      localStorage.removeItem('auth_token');
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }
}
