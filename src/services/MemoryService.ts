/**
 * TaskFlow Advanced Memory System
 * מערכת זיכרון היררכית מתקדמת עם למידה אדפטיבית
 */
import { Task, User, ChatMessage } from '../types';
import { FirebaseService } from './FirebaseService';

// Enhanced Memory Types
export interface UserInteraction {
  id: string;
  userId: string;
  type: 'task_created' | 'task_completed' | 'task_deleted' | 'chat_message' | 'planning_session' | 'analytics_view';
  data: any;
  context: {
    timeOfDay: number;
    dayOfWeek: number;
    tasksCount: number;
    mood?: 'productive' | 'stressed' | 'relaxed';
  };
  timestamp: Date;
}

export interface UserPattern {
  id: string;
  type: 'temporal' | 'behavioral' | 'preference';
  pattern: string;
  frequency: number;
  confidence: number;
  examples: UserInteraction[];
  lastSeen: Date;
}

export interface ConversationContext {
  currentSession: ChatMessage[];
  activeTopics: string[];
  recentTasks: Task[];
  sessionStartTime: Date;
  userMood?: 'productive' | 'stressed' | 'relaxed';
}

export interface UserProfile {
  userId: string;
  preferences: {
    preferredWorkingHours: { start: number; end: number };
    taskCategories: string[];
    priorityStyle: 'urgent_first' | 'important_first' | 'balanced';
    planningFrequency: 'daily' | 'weekly' | 'monthly';
    reminderStyle: 'gentle' | 'assertive' | 'minimal';
  };
  patterns: UserPattern[];
  productivity_insights: {
    mostProductiveTime: number;
    averageTasksPerDay: number;
    completionRate: number;
    preferredTaskTypes: string[];
    workStreaks: { start: Date; end: Date; tasksCompleted: number }[];
  };
  lastUpdated: Date;
}

export interface MemoryContext {
  recentContext: ChatMessage[];
  similarSessions: any[];
  preferences: UserProfile['preferences'];
  relevantPatterns: UserPattern[];
  currentProductivityState: 'high' | 'medium' | 'low';
}

export interface ContextMemory {
  type: 'task_pattern' | 'time_preference' | 'priority_style' | 'communication_style';
  pattern: string;
  examples: string[];
  frequency: number;
  lastSeen: Date;
}

export interface ConversationContext {
  topics: string[];
  keywords: string[];
  mood: 'formal' | 'casual' | 'urgent' | 'relaxed';
  taskTypes: string[];
  timeframe: string;
}

class MemoryService {
  private preferences: Map<string, UserPreference> = new Map();
  private contextMemory: Map<string, ContextMemory> = new Map();
  private conversationHistory: ConversationContext[] = [];

  /**
   * שמירת העדפת משתמש
   */
  async saveUserPreference(userId: string, key: string, value: any, confidence: number = 0.5) {
    const existingPref = this.preferences.get(`${userId}:${key}`);
    
    const preference: UserPreference = {
      key,
      value,
      confidence: existingPref ? Math.min(existingPref.confidence + 0.1, 1.0) : confidence,
      lastUpdated: new Date(),
      frequency: existingPref ? existingPref.frequency + 1 : 1
    };

    this.preferences.set(`${userId}:${key}`, preference);
    // 🔒 Security: Log preference save without exposing value
    console.log(`💾 Saved preference: ${key} (confidence: ${preference.confidence})`);
    
    return preference;
  }

  /**
   * קבלת העדפת משתמש
   */
  getUserPreference(userId: string, key: string): UserPreference | null {
    return this.preferences.get(`${userId}:${key}`) || null;
  }

  /**
   * ניתוח ולמידה מהודעה
   */
  async learnFromMessage(userId: string, message: string, isUser: boolean = true) {
    if (!isUser) return; // לומד רק מהודעות המשתמש

    // זיהוי דפוסי זמן
    this.extractTimePreferences(userId, message);
    
    // זיהוי סגנון תקשורת
    this.extractCommunicationStyle(userId, message);
    
    // זיהוי דפוסי משימות
    this.extractTaskPatterns(userId, message);
    
    // זיהוי העדפות עדיפות
    this.extractPriorityPreferences(userId, message);
  }

  private extractTimePreferences(userId: string, message: string) {
    const timePatterns = [
      { pattern: /בבוקר|בוקר טוב/, value: 'morning', key: 'preferred_time' },
      { pattern: /אחר הצהריים|צהריים/, value: 'afternoon', key: 'preferred_time' },
      { pattern: /בערב|ערב טוב/, value: 'evening', key: 'preferred_time' },
      { pattern: /מחר|מחרתיים/, value: 'next_day', key: 'planning_horizon' },
      { pattern: /השבוע|שבוע הבא/, value: 'weekly', key: 'planning_horizon' },
      { pattern: /החודש|החודש הבא/, value: 'monthly', key: 'planning_horizon' }
    ];

    timePatterns.forEach(({ pattern, value, key }) => {
      if (pattern.test(message)) {
        this.saveUserPreference(userId, key, value, 0.3);
      }
    });
  }

  private extractCommunicationStyle(userId: string, message: string) {
    // סגנון פורמלי
    if (/אנא|בבקשה|תודה רבה|מר\/גב/.test(message)) {
      this.saveUserPreference(userId, 'communication_style', 'formal', 0.4);
    }
    
    // סגנון קז'ואל
    if (/היי|שלום|תודה|תקשיב/.test(message)) {
      this.saveUserPreference(userId, 'communication_style', 'casual', 0.4);
    }
    
    // סגנון דחוף
    if (/מיידי|דחוף|עכשיו|מהר/.test(message)) {
      this.saveUserPreference(userId, 'communication_style', 'urgent', 0.5);
    }
  }

  private extractTaskPatterns(userId: string, message: string) {
    const taskTypes = [
      { pattern: /עבודה|משרד|פגישה|מייל/, type: 'work' },
      { pattern: /בית|נקיון|קניות|משפחה/, type: 'home' },
      { pattern: /ספורט|חדר כושר|ריצה|בריכה/, type: 'fitness' },
      { pattern: /לימודים|קורס|ספר|מבחן/, type: 'education' },
      { pattern: /רופא|בריאות|תרופות/, type: 'health' },
      { pattern: /חברים|משפחה|יום הולדת/, type: 'social' }
    ];

    taskTypes.forEach(({ pattern, type }) => {
      if (pattern.test(message)) {
        this.saveUserPreference(userId, 'preferred_task_types', type, 0.3);
      }
    });
  }

  private extractPriorityPreferences(userId: string, message: string) {
    if (/חשוב|דחוף|עדיפות גבוהה/.test(message)) {
      this.saveUserPreference(userId, 'default_priority', 'high', 0.4);
    } else if (/לא דחוף|זמן פנוי|כשיהיה זמן/.test(message)) {
      this.saveUserPreference(userId, 'default_priority', 'low', 0.4);
    }
  }

  /**
   * בניית הקשר מותאם אישית
   */
  buildPersonalizedContext(userId: string): any {
    const context: any = {
      preferences: {},
      patterns: {},
      suggestions: []
    };

    // העדפות זמן
    const timePreference = this.getUserPreference(userId, 'preferred_time');
    if (timePreference && timePreference.confidence > 0.5) {
      context.preferences.timeOfDay = timePreference.value;
    }

    // סגנון תקשורת
    const commStyle = this.getUserPreference(userId, 'communication_style');
    if (commStyle && commStyle.confidence > 0.5) {
      context.preferences.communicationStyle = commStyle.value;
    }

    // עדיפות ברירת מחדל
    const defaultPriority = this.getUserPreference(userId, 'default_priority');
    if (defaultPriority && defaultPriority.confidence > 0.5) {
      context.preferences.defaultPriority = defaultPriority.value;
    }

    // אופק תכנון
    const planningHorizon = this.getUserPreference(userId, 'planning_horizon');
    if (planningHorizon && planningHorizon.confidence > 0.5) {
      context.preferences.planningHorizon = planningHorizon.value;
    }

    return context;
  }

  /**
   * הצעות מותאמות אישית
   */
  generatePersonalizedSuggestions(userId: string): string[] {
    const suggestions: string[] = [];
    const context = this.buildPersonalizedContext(userId);

    // הצעות על בסיס זמן מועדף
    if (context.preferences.timeOfDay === 'morning') {
      suggestions.push('מה התוכניות לבוקר?');
      suggestions.push('בואו נתכנן את היום');
    } else if (context.preferences.timeOfDay === 'evening') {
      suggestions.push('איך היה היום?');
      suggestions.push('מה בתוכנית למחר?');
    }

    // הצעות על בסיס סגנון תקשורת
    if (context.preferences.communicationStyle === 'formal') {
      suggestions.push('אנא עזור לי לתכנן את המשימות');
    } else if (context.preferences.communicationStyle === 'casual') {
      suggestions.push('בואו נסדר את העניינים');
    }

    return suggestions.length > 0 ? suggestions : [
      'מה אתה צריך לעשות היום?',
      'איך אני יכול לעזור?',
      'בואו נתכנן משהו יחד'
    ];
  }

  /**
   * ניקוי זיכרון ישן
   */
  cleanupOldMemories(maxAge: number = 30 * 24 * 60 * 60 * 1000) { // 30 ימים
    const now = new Date();
    
    this.preferences.forEach((pref, key) => {
      if (now.getTime() - pref.lastUpdated.getTime() > maxAge && pref.confidence < 0.3) {
        this.preferences.delete(key);
        console.log(`🗑️ Cleaned up old preference: ${key}`);
      }
    });
  }

  /**
   * קבלת סטטיסטיקות זיכרון
   */
  getMemoryStats(userId: string) {
    const userPrefs = Array.from(this.preferences.entries())
      .filter(([key]) => key.startsWith(`${userId}:`));

    return {
      totalPreferences: userPrefs.length,
      highConfidencePreferences: userPrefs.filter(([, pref]) => pref.confidence > 0.7).length,
      averageConfidence: userPrefs.reduce((sum, [, pref]) => sum + pref.confidence, 0) / userPrefs.length || 0,
      lastActivity: userPrefs.length > 0 ? 
        Math.max(...userPrefs.map(([, pref]) => pref.lastUpdated.getTime())) : 0
    };
  }
}

export const memoryService = new MemoryService();
