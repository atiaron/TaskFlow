/**
 * TaskFlow Advanced Memory Service
 * זיכרון חכם ולמידה אדפטיבית לTaskFlow
 */

export interface UserMemoryProfile {
  userId: string;
  patterns: {
    timePreferences: {
      morningPerson: boolean;
      eveningPerson: boolean;
      weekendWorker: boolean;
      confidence: number;
    };
    taskCategories: {
      [category: string]: {
        frequency: number;
        priority: 'high' | 'medium' | 'low';
        confidence: number;
      };
    };
    communicationStyle: {
      formal: boolean;
      direct: boolean;
      detailed: boolean;
      confidence: number;
    };
    productivityPatterns: {
      bestHours: number[];
      averageTasksPerDay: number;
      completionRate: number;
      confidence: number;
    };
  };
  preferences: {
    defaultPriority: 'high' | 'medium' | 'low';
    planningHorizon: 'daily' | 'weekly' | 'monthly';
    reminderStyle: 'gentle' | 'assertive' | 'minimal';
    taskDetailLevel: 'brief' | 'detailed' | 'comprehensive';
  };
  conversationHistory: {
    totalMessages: number;
    commonTopics: string[];
    recentThemes: string[];
    lastUpdated: Date;
  };
  createdAt: Date;
  lastUpdated: Date;
}

export interface ContextMemory {
  type: 'successful_action' | 'failed_action' | 'user_feedback' | 'pattern_detection';
  content: any;
  timestamp: Date;
  confidence: number;
  relevanceScore: number;
}

class TaskFlowMemoryService {
  private memoryProfiles: Map<string, UserMemoryProfile> = new Map();
  private contextMemory: ContextMemory[] = [];
  private maxContextMemory = 1000;

  /**
   * יצירת פרופיל זיכרון חדש למשתמש
   */
  async createMemoryProfile(userId: string): Promise<UserMemoryProfile> {
    const profile: UserMemoryProfile = {
      userId,
      patterns: {
        timePreferences: {
          morningPerson: false,
          eveningPerson: false,
          weekendWorker: false,
          confidence: 0
        },
        taskCategories: {},
        communicationStyle: {
          formal: false,
          direct: false,
          detailed: false,
          confidence: 0
        },
        productivityPatterns: {
          bestHours: [],
          averageTasksPerDay: 0,
          completionRate: 0,
          confidence: 0
        }
      },
      preferences: {
        defaultPriority: 'medium',
        planningHorizon: 'daily',
        reminderStyle: 'gentle',
        taskDetailLevel: 'detailed'
      },
      conversationHistory: {
        totalMessages: 0,
        commonTopics: [],
        recentThemes: [],
        lastUpdated: new Date()
      },
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    this.memoryProfiles.set(userId, profile);
    await this.saveToStorage(userId, profile);
    
    console.log('🧠 Created new memory profile for user:', userId);
    return profile;
  }

  /**
   * למידה מהודעת משתמש
   */
  async learnFromMessage(userId: string, message: string, messageType: 'user' | 'ai'): Promise<void> {
    let profile = this.memoryProfiles.get(userId);
    
    if (!profile) {
      profile = await this.createMemoryProfile(userId);
    }

    if (messageType === 'user') {
      // עדכון סטטיסטיקות שיחה
      profile.conversationHistory.totalMessages++;
      profile.conversationHistory.lastUpdated = new Date();

      // ניתוח דפוסי זמן
      await this.analyzeTimePatterns(profile, message);
      
      // ניתוח קטגוריות משימות
      await this.analyzeTaskCategories(profile, message);
      
      // ניתוח סגנון תקשורת
      await this.analyzeCommunicationStyle(profile, message);
      
      // ניתוח נושאים נפוצים
      await this.analyzeTopics(profile, message);

      profile.lastUpdated = new Date();
      this.memoryProfiles.set(userId, profile);
      await this.saveToStorage(userId, profile);
    }
  }

  /**
   * ניתוח דפוסי זמן מהודעה
   */
  private async analyzeTimePatterns(profile: UserMemoryProfile, message: string): Promise<void> {
    const currentHour = new Date().getHours();
    
    // זיהוי העדפות זמן
    if (/בבוקר|בוקר טוב|מוקדם/gi.test(message)) {
      profile.patterns.timePreferences.morningPerson = true;
      profile.patterns.timePreferences.confidence = Math.min(
        profile.patterns.timePreferences.confidence + 0.1, 
        1.0
      );
    }
    
    if (/בערב|ערב טוב|מאוחר/gi.test(message)) {
      profile.patterns.timePreferences.eveningPerson = true;
      profile.patterns.timePreferences.confidence = Math.min(
        profile.patterns.timePreferences.confidence + 0.1, 
        1.0
      );
    }
    
    if ((new Date().getDay() === 0 || new Date().getDay() === 6) && 
        /עבודה|משימות|פרויקט/gi.test(message)) {
      profile.patterns.timePreferences.weekendWorker = true;
    }

    // רישום שעות פעילות
    if (!profile.patterns.productivityPatterns.bestHours.includes(currentHour)) {
      profile.patterns.productivityPatterns.bestHours.push(currentHour);
      profile.patterns.productivityPatterns.bestHours.sort((a, b) => a - b);
      
      // שמירה על 5 השעות הטובות ביותר
      if (profile.patterns.productivityPatterns.bestHours.length > 5) {
        profile.patterns.productivityPatterns.bestHours = 
          profile.patterns.productivityPatterns.bestHours.slice(-5);
      }
    }
  }

  /**
   * ניתוח קטגוריות משימות
   */
  private async analyzeTaskCategories(profile: UserMemoryProfile, message: string): Promise<void> {
    const categories = [
      { keywords: ['עבודה', 'משרד', 'פגישה', 'מייל', 'דוח'], category: 'work' },
      { keywords: ['בית', 'משפחה', 'קניות', 'נקיון', 'בישול'], category: 'personal' },
      { keywords: ['ספורט', 'בריאות', 'רופא', 'חדר כושר', 'ריצה'], category: 'health' },
      { keywords: ['לימודים', 'קורס', 'ספר', 'מבחן', 'לימוד'], category: 'education' },
      { keywords: ['חברים', 'יום הולדת', 'מסיבה', 'ארגון'], category: 'social' },
      { keywords: ['כסף', 'תשלום', 'חשבון', 'בנק'], category: 'finance' }
    ];

    categories.forEach(({ keywords, category }) => {
      keywords.forEach(keyword => {
        if (message.toLowerCase().includes(keyword)) {
          if (!profile.patterns.taskCategories[category]) {
            profile.patterns.taskCategories[category] = {
              frequency: 0,
              priority: 'medium',
              confidence: 0
            };
          }
          
          profile.patterns.taskCategories[category].frequency++;
          profile.patterns.taskCategories[category].confidence = Math.min(
            profile.patterns.taskCategories[category].confidence + 0.1,
            1.0
          );

          // זיהוי עדיפות על בסיס מילים
          if (/דחוף|חשוב|מיידי/gi.test(message)) {
            profile.patterns.taskCategories[category].priority = 'high';
          }
        }
      });
    });
  }

  /**
   * ניתוח סגנון תקשורת
   */
  private async analyzeCommunicationStyle(profile: UserMemoryProfile, message: string): Promise<void> {
    // סגנון פורמלי
    if (/אנא|בבקשה|תודה רבה|כבוד|נכבד/gi.test(message)) {
      profile.patterns.communicationStyle.formal = true;
      profile.patterns.communicationStyle.confidence += 0.1;
    }
    
    // סגנון ישיר
    if (/צריך|רוצה|עשה|תעשה/gi.test(message) && message.length < 50) {
      profile.patterns.communicationStyle.direct = true;
      profile.patterns.communicationStyle.confidence += 0.1;
    }
    
    // סגנון מפורט
    if (message.length > 100 || /כלומר|לדוגמה|בפרטים|בפירוט/gi.test(message)) {
      profile.patterns.communicationStyle.detailed = true;
      profile.patterns.communicationStyle.confidence += 0.1;
    }

    profile.patterns.communicationStyle.confidence = Math.min(
      profile.patterns.communicationStyle.confidence,
      1.0
    );
  }

  /**
   * ניתוח נושאים נפוצים
   */
  private async analyzeTopics(profile: UserMemoryProfile, message: string): Promise<void> {
    const topics = message.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !/^(את|של|עם|אני|זה|היא|הוא)$/.test(word));

    // עדכון נושאים אחרונים
    profile.conversationHistory.recentThemes = [
      ...topics.slice(0, 3),
      ...profile.conversationHistory.recentThemes
    ].slice(0, 10);

    // עדכון נושאים נפוצים
    topics.forEach(topic => {
      if (!profile.conversationHistory.commonTopics.includes(topic)) {
        profile.conversationHistory.commonTopics.push(topic);
      }
    });

    // שמירה על 20 הנושאים הנפוצים ביותר
    if (profile.conversationHistory.commonTopics.length > 20) {
      profile.conversationHistory.commonTopics = 
        profile.conversationHistory.commonTopics.slice(-20);
    }
  }

  /**
   * למידה מפעולה שבוצעה
   */
  async learnFromAction(userId: string, action: any, success: boolean): Promise<void> {
    const profile = this.memoryProfiles.get(userId);
    if (!profile) return;

    // רישום הפעולה בזיכרון הקשר
    this.contextMemory.push({
      type: success ? 'successful_action' : 'failed_action',
      content: action,
      timestamp: new Date(),
      confidence: success ? 0.8 : 0.3,
      relevanceScore: 0.7
    });

    // עדכון דפוסי פרודקטיביות
    if (action.type === 'create_task' && success) {
      profile.patterns.productivityPatterns.averageTasksPerDay += 0.1;
    }

    if (success) {
      profile.patterns.productivityPatterns.completionRate = Math.min(
        profile.patterns.productivityPatterns.completionRate + 0.05,
        1.0
      );
    }

    // ניקוי זיכרון הקשר ישן
    if (this.contextMemory.length > this.maxContextMemory) {
      this.contextMemory = this.contextMemory.slice(-this.maxContextMemory);
    }

    profile.lastUpdated = new Date();
    this.memoryProfiles.set(userId, profile);
    await this.saveToStorage(userId, profile);
  }

  /**
   * קבלת הקשר רלוונטי למשתמש
   */
  async getPersonalizedContext(userId: string): Promise<any> {
    const profile = this.memoryProfiles.get(userId) || await this.loadFromStorage(userId);
    
    if (!profile) {
      return await this.createMemoryProfile(userId);
    }

    // בניית הקשר מותאם אישית
    const context = {
      userProfile: {
        timePreferences: profile.patterns.timePreferences,
        preferredCategories: this.getTopCategories(profile),
        communicationStyle: profile.patterns.communicationStyle,
        productivityInsights: profile.patterns.productivityPatterns
      },
      preferences: profile.preferences,
      recentThemes: profile.conversationHistory.recentThemes.slice(0, 5),
      relevantContext: this.getRelevantContextMemory(userId, 5)
    };

    return context;
  }

  /**
   * קבלת קטגוריות העליונות של המשתמש
   */
  private getTopCategories(profile: UserMemoryProfile): string[] {
    return Object.entries(profile.patterns.taskCategories)
      .sort(([,a], [,b]) => b.frequency - a.frequency)
      .slice(0, 3)
      .map(([category]) => category);
  }

  /**
   * קבלת זיכרון הקשר רלוונטי
   */
  private getRelevantContextMemory(userId: string, limit: number): ContextMemory[] {
    return this.contextMemory
      .filter(memory => memory.relevanceScore > 0.5)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * שמירה ב-localStorage (אפשר להחליף ל-Firestore)
   */
  private async saveToStorage(userId: string, profile: UserMemoryProfile): Promise<void> {
    try {
      localStorage.setItem(`taskflow_memory_${userId}`, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save memory profile:', error);
    }
  }

  /**
   * קריאה מ-localStorage
   */
  private async loadFromStorage(userId: string): Promise<UserMemoryProfile | null> {
    try {
      const stored = localStorage.getItem(`taskflow_memory_${userId}`);
      if (stored) {
        const profile = JSON.parse(stored);
        this.memoryProfiles.set(userId, profile);
        return profile;
      }
    } catch (error) {
      console.error('Failed to load memory profile:', error);
    }
    return null;
  }

  /**
   * יצירת הצעות מותאמות אישית
   */
  async generatePersonalizedSuggestions(userId: string): Promise<string[]> {
    const profile = this.memoryProfiles.get(userId);
    if (!profile) return this.getDefaultSuggestions();

    const suggestions: string[] = [];
    const currentHour = new Date().getHours();

    // הצעות על בסיס זמן
    if (profile.patterns.timePreferences.morningPerson && currentHour < 12) {
      suggestions.push('תכנן את הבוקר שלי בצורה מושלמת');
      suggestions.push('מה המשימות הכי חשובות להיום?');
    }

    if (profile.patterns.timePreferences.eveningPerson && currentHour > 17) {
      suggestions.push('איך היה היום? בואו נסכם');
      suggestions.push('מה בתוכנית למחר?');
    }

    // הצעות על בסיס קטגוריות נפוצות
    const topCategories = this.getTopCategories(profile);
    topCategories.forEach(category => {
      switch (category) {
        case 'work':
          suggestions.push('עזור לי לתכנן את יום העבודה');
          break;
        case 'personal':
          suggestions.push('מה צריך לעשות בבית השבוע?');
          break;
        case 'health':
          suggestions.push('איך לארגן את השגרת הבריאות שלי?');
          break;
      }
    });

    // הצעות על בסיס סגנון תקשורת
    if (profile.patterns.communicationStyle.detailed) {
      suggestions.push('תן לי ניתוח מפורט של המשימות שלי');
    } else if (profile.patterns.communicationStyle.direct) {
      suggestions.push('מה הכי חשוב עכשיו?');
    }

    return suggestions.length > 0 ? suggestions.slice(0, 4) : this.getDefaultSuggestions();
  }

  /**
   * הצעות ברירת מחדל
   */
  private getDefaultSuggestions(): string[] {
    return [
      'תכנן את היום שלי',
      'צור משימה דחופה חדשה',
      'נתח את הפרודקטיביות שלי',
      'עזור לי לארגן את השבוע'
    ];
  }

  /**
   * סטטיסטיקות זיכרון
   */
  getMemoryStats(userId: string): any {
    const profile = this.memoryProfiles.get(userId);
    if (!profile) return null;

    return {
      profileAge: Date.now() - profile.createdAt.getTime(),
      totalMessages: profile.conversationHistory.totalMessages,
      learnedPatterns: Object.keys(profile.patterns.taskCategories).length,
      confidenceLevel: {
        timePreferences: profile.patterns.timePreferences.confidence,
        communication: profile.patterns.communicationStyle.confidence,
        productivity: profile.patterns.productivityPatterns.confidence
      },
      topCategories: this.getTopCategories(profile),
      bestHours: profile.patterns.productivityPatterns.bestHours
    };
  }

  /**
   * איפוס זיכרון משתמש
   */
  async resetUserMemory(userId: string): Promise<void> {
    this.memoryProfiles.delete(userId);
    localStorage.removeItem(`taskflow_memory_${userId}`);
    console.log('🗑️ Reset memory for user:', userId);
  }
}

export const taskFlowMemoryService = new TaskFlowMemoryService();
