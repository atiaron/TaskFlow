/* Temporary Auth Service to avoid Railway URLs */
import { User } from '../types';

export class TemporaryAuthService {
  private static listeners: ((user: User | null) => void)[] = [];
  private static currentUser: User | null = null;

  static async initializeGoogleAuth(): Promise<boolean> {
    console.log('🚧 TemporaryAuthService: Skipping Google Auth initialization to avoid Railway URLs');
    return true;
  }

  static async login(): Promise<User> {
    console.log('🚧 TemporaryAuthService: Mock login process');
    return this.signInWithGoogle();
  }

  static async signInWithGoogle(): Promise<User> {
    console.log('🚧 TemporaryAuthService: Creating mock user for development');
    
    // Create a simple mock user that fits the User type
    const mockUser: any = {
      id: 'dev-user-123',
      email: 'developer@taskflow.local',
      display_name: 'Developer User',
      created_at: new Date(),
      last_active: new Date(),
      plan: 'free',
      settings: {
        language: 'he',
        timezone: 'Asia/Jerusalem',
        theme: 'light',
        notifications_enabled: true,
        email_notifications: true,
        push_notifications: false,
        daily_planning_time: '09:00',
        evening_review_time: '18:00',
        ai_suggestions_enabled: true,
        auto_task_creation: false,
        confirmation_threshold: 80,
        privacy_mode: false,
        data_retention_days: 365,
        sensitive_data_encryption: true,
        cost_alerts: true,
        monthly_budget: 100,
        optimization_mode: true
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
          push: false,
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
          data_transfer: 0
        },
        completion_rate: 0,
        average_task_duration: 0,
        most_active_hours: ['09:00', '10:00', '14:00'],
        streak_days: 0
      }
    };
    
    this.currentUser = mockUser;
    this.notifyListeners(mockUser);
    console.log('✅ Mock user created and logged in:', mockUser.email);
    return mockUser;
  }

  static async signOut(): Promise<void> {
    console.log('🚧 TemporaryAuthService: Mock Sign Out');
    this.currentUser = null;
    this.notifyListeners(null);
  }

  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    
    // Immediately call with current user (null)
    callback(this.currentUser);
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private static notifyListeners(user: User | null) {
    this.listeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  static async refreshToken(): Promise<boolean> {
    console.log('🚧 TemporaryAuthService: Skipping token refresh to avoid Railway URLs');
    return false;
  }

  static getAccessToken(): string | null {
    console.log('🚧 TemporaryAuthService: No access token - backend disabled');
    return null;
  }

  static clearTokens(): void {
    console.log('🚧 TemporaryAuthService: Mock clear tokens');
  }
}
