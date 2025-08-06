/**
 * TaskFlow Proactive Suggestion Engine
 * מנוע הצעות חכמות ויזומות למשתמש
 */

import { memoryService } from './MemoryService';

export interface ProactiveSuggestion {
  id: string;
  type: 'task_completion' | 'time_optimization' | 'workflow_improvement' | 'health_reminder' | 'efficiency_tip';
  title: string;
  description: string;
  action?: () => void;
  priority: 'high' | 'medium' | 'low';
  timing: Date;
  context: any;
  dismissed?: boolean;
}

export interface UserBehaviorPattern {
  type: string;
  frequency: number;
  lastOccurrence: Date;
  confidence: number;
  examples: string[];
}

class ProactiveEngine {
  private suggestions: Map<string, ProactiveSuggestion> = new Map();
  private behaviorPatterns: Map<string, UserBehaviorPattern> = new Map();
  private analysisInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startPeriodicAnalysis();
  }

  /**
   * ניתוח יזום והפקת הצעות
   */
  private startPeriodicAnalysis() {
    // ניתוח כל 5 דקות
    this.analysisInterval = setInterval(() => {
      this.analyzeAndSuggest();
    }, 5 * 60 * 1000);
  }

  /**
   * ניתוח והפקת הצעות מבוססות דפוסים
   */
  async analyzeAndSuggest(userId?: string) {
    if (!userId) return;

    console.log('🔮 Starting proactive analysis...');

    // ניתוח דפוסי זמן
    await this.analyzeTimePatterns(userId);
    
    // ניתוח פרודקטיביות
    await this.analyzeProductivityPatterns(userId);
    
    // ניתוח עומס משימות
    await this.analyzeTaskLoad(userId);
    
    // הצעות בריאות ורווחה
    await this.generateWellnessSuggestions(userId);
    
    // הצעות אופטימיזציה
    await this.generateOptimizationSuggestions(userId);

    console.log(`💡 Generated ${this.suggestions.size} proactive suggestions`);
  }

  /**
   * ניתוח דפוסי זמן
   */
  private async analyzeTimePatterns(userId: string) {
    const timePreference = memoryService.getUserPreference(userId, 'preferred_time');
    const currentHour = new Date().getHours();

    // הצעות על בסיס זמן מועדף
    if (timePreference?.value === 'morning' && currentHour >= 8 && currentHour <= 10) {
      this.addSuggestion(userId, {
        type: 'workflow_improvement',
        title: 'תכנון יום מושלם',
        description: 'זה הזמן המושלם שלך לתכנון! בואו נארגן את היום',
        priority: 'high',
        context: { timeBasedSuggestion: true }
      });
    }

    // זיהוי שעות לא פרודקטיביות
    if (currentHour >= 14 && currentHour <= 16) {
      this.addSuggestion(userId, {
        type: 'efficiency_tip',
        title: 'הפוגה אחר הצהריים',
        description: 'נראה שזה הזמן להפוגה קצרה - מה דעתך על משהו קל?',
        priority: 'low',
        context: { lowEnergyTime: true }
      });
    }
  }

  /**
   * ניתוח פרודקטיביות
   */
  private async analyzeProductivityPatterns(userId: string) {
    // TODO: קבלת נתוני משימות מהשבוע האחרון
    // const weeklyTasks = await StorageService.getTasksFromLastWeek(userId);
    
    // סימולציה של ניתוח פרודקטיביות
    const productivityScore = Math.random(); // 0-1
    
    if (productivityScore < 0.3) {
      this.addSuggestion(userId, {
        type: 'workflow_improvement',
        title: 'בואו נשפר את הפרודקטיביות',
        description: 'נראה שהיו כמה עיכובים השבוע. אולי נחלק משימות גדולות לקטנות יותר?',
        priority: 'medium',
        context: { lowProductivity: true, score: productivityScore }
      });
    } else if (productivityScore > 0.8) {
      this.addSuggestion(userId, {
        type: 'efficiency_tip',
        title: 'שבוע מעולה! 🎉',
        description: 'אתה בדרך מצוינת! מה דעתך להציב יעד מאתגר יותר השבוע הקרוב?',
        priority: 'low',
        context: { highProductivity: true, score: productivityScore }
      });
    }
  }

  /**
   * ניתוח עומס משימות
   */
  private async analyzeTaskLoad(userId: string) {
    // TODO: קבלת משימות פעילות
    // const activeTasks = await StorageService.getActiveTasks(userId);
    
    // סימולציה של ניתוח עומס
    const taskCount = Math.floor(Math.random() * 20);
    
    if (taskCount > 15) {
      this.addSuggestion(userId, {
        type: 'workflow_improvement',
        title: 'יותר מדי במתג? 🤯',
        description: `יש לך ${taskCount} משימות פעילות. בואו נקבע עדיפויות ונתמקד בחשוב ביותר`,
        priority: 'high',
        context: { overloaded: true, taskCount }
      });
    } else if (taskCount < 3) {
      this.addSuggestion(userId, {
        type: 'task_completion',
        title: 'הזמן לאתגרים חדשים! 🚀',
        description: 'נראה שיש לך מקום לעוד. מה דעתך על פרויקט חדש ומעניין?',
        priority: 'low',
        context: { underloaded: true, taskCount }
      });
    }
  }

  /**
   * הצעות בריאות ורווחה
   */
  private async generateWellnessSuggestions(userId: string) {
    const currentHour = new Date().getHours();
    
    // תזכורת למים
    if (currentHour % 2 === 0) { // כל שעתיים
      this.addSuggestion(userId, {
        type: 'health_reminder',
        title: 'זמן לכוס מים 💧',
        description: 'חשוב לשמור על לחות - מה דעתך על הפוגה קצרה למים?',
        priority: 'low',
        context: { hydrationReminder: true }
      });
    }

    // תזכורת לפעילות גופנית
    if (currentHour === 18) { // 6 בערב
      this.addSuggestion(userId, {
        type: 'health_reminder',
        title: 'זמן לזוז! 🏃‍♂️',
        description: 'אחרי יום עבודה טוב, מה דעתך על קצת פעילות גופנית?',
        priority: 'medium',
        context: { exerciseReminder: true }
      });
    }
  }

  /**
   * הצעות אופטימיזציה
   */
  private async generateOptimizationSuggestions(userId: string) {
    // זיהוי משימות חוזרות
    const recurringPattern = memoryService.getUserPreference(userId, 'recurring_tasks');
    
    if (recurringPattern && recurringPattern.confidence > 0.6) {
      this.addSuggestion(userId, {
        type: 'efficiency_tip',
        title: 'אוטומציה חכמה 🤖',
        description: 'זיהיתי משימות שחוזרות על עצמן. בואו ניצור תבנית או תזכורת אוטומטית',
        priority: 'medium',
        context: { automationOpportunity: true, pattern: recurringPattern.value }
      });
    }

    // הצעות לקיבוץ משימות
    this.addSuggestion(userId, {
      type: 'efficiency_tip',
      title: 'קיבוץ חכם של משימות 📋',
      description: 'מה דעתך לקבץ משימות דומות יחד? זה יחסוך זמן ומאמץ',
      priority: 'low',
      context: { batchingOpportunity: true }
    });
  }

  /**
   * הוספת הצעה חדשה
   */
  private addSuggestion(userId: string, suggestion: Omit<ProactiveSuggestion, 'id' | 'timing'>) {
    const id = `${userId}_${Date.now()}_${Math.random()}`;
    const fullSuggestion: ProactiveSuggestion = {
      ...suggestion,
      id,
      timing: new Date()
    };

    this.suggestions.set(id, fullSuggestion);
    console.log(`💡 Added suggestion: ${suggestion.title}`);
  }

  /**
   * קבלת הצעות למשתמש
   */
  getSuggestionsForUser(userId: string, limit: number = 5): ProactiveSuggestion[] {
    const userSuggestions = Array.from(this.suggestions.values())
      .filter(s => s.id.startsWith(userId) && !s.dismissed)
      .sort((a, b) => {
        // מיון לפי עדיפות ואז לפי זמן
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.timing.getTime() - a.timing.getTime();
      })
      .slice(0, limit);

    return userSuggestions;
  }

  /**
   * דחיית הצעה
   */
  dismissSuggestion(suggestionId: string) {
    const suggestion = this.suggestions.get(suggestionId);
    if (suggestion) {
      suggestion.dismissed = true;
      console.log(`🗑️ Dismissed suggestion: ${suggestion.title}`);
    }
  }

  /**
   * ביצוע פעולת הצעה
   */
  executeSuggestionAction(suggestionId: string) {
    const suggestion = this.suggestions.get(suggestionId);
    if (suggestion && suggestion.action) {
      suggestion.action();
      this.dismissSuggestion(suggestionId);
      console.log(`✅ Executed suggestion: ${suggestion.title}`);
    }
  }

  /**
   * ניקוי הצעות ישנות
   */
  cleanupOldSuggestions(maxAge: number = 24 * 60 * 60 * 1000) { // 24 שעות
    const now = new Date();
    const toDelete: string[] = [];

    this.suggestions.forEach((suggestion, id) => {
      if (now.getTime() - suggestion.timing.getTime() > maxAge) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => {
      this.suggestions.delete(id);
    });

    if (toDelete.length > 0) {
      console.log(`🗑️ Cleaned up ${toDelete.length} old suggestions`);
    }
  }

  /**
   * סטטיסטיקות הצעות
   */
  getSuggestionStats(userId: string): any {
    const userSuggestions = Array.from(this.suggestions.values())
      .filter(s => s.id.startsWith(userId));

    const stats = {
      total: userSuggestions.length,
      active: userSuggestions.filter(s => !s.dismissed).length,
      dismissed: userSuggestions.filter(s => s.dismissed).length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };

    userSuggestions.forEach(s => {
      stats.byType[s.type] = (stats.byType[s.type] || 0) + 1;
      stats.byPriority[s.priority] = (stats.byPriority[s.priority] || 0) + 1;
    });

    return stats;
  }

  /**
   * עצירת המנוע
   */
  stop() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
      console.log('🛑 Proactive engine stopped');
    }
  }
}

export const proactiveEngine = new ProactiveEngine();
