export class AdvancedAIService {
  
  // 🧠 זיכרון חכם - AI יזכור הכל עליך
  private static memorySystem = {
    preferences: new Map<string, any>(),
    patterns: new Map<string, any>(),
    context: new Map<string, any>()
  };

  // 🎯 אלגוריתם למידה של הרגלים
  static async learnUserPatterns(tasks: Task[], interactions: any[]) {
    const patterns = {
      // באיזה שעות אתה הכי פרודקטיבי
      productiveHours: this.analyzeProductiveHours(tasks),
      
      // כמה זמן באמת לוקח לך כל סוג משימה
      realTaskDurations: this.analyzeTaskDurations(tasks),
      
      // איזה ביטויים אתה משתמש למשימות דומות
      phrasePatterns: this.analyzeUserPhrases(interactions),
      
      // איזה משימות אתה נוטה לדחות
      procrastinationPatterns: this.analyzeProcrastination(tasks),
      
      // הקשרים בין משימות (אם עשית X, בדרך כלל תעשה Y)
      taskRelationships: this.analyzeTaskRelationships(tasks)
    };

    this.memorySystem.patterns.set('user_behavior', patterns);
    return patterns;
  }

  // 🤖 תגובות מותאמות אישית לחלוטין
  static buildPersonalizedPrompt(userInput: string, context: any): string {
    const patterns = this.memorySystem.patterns.get('user_behavior');
    const preferences = this.memorySystem.preferences.get('user_prefs');
    
    return `
אתה העוזר האישי של ${context.userName || 'atiaron'}.

מה שאתה יודע עליו:
- שעות פרודקטיביות: ${patterns?.productiveHours || 'לא נאספו נתונים עדיין'}
- סגנון תקשורת: ${preferences?.communicationStyle || 'ידידותי וישיר'}
- העדפות זמן: ${preferences?.timePreferences || 'לא נקבעו'}
- משימות שנוטה לדחות: ${patterns?.procrastinationPatterns || 'אין דפוס זוהה'}

הקשר נוכחי:
- זמן: ${new Date().toLocaleString('he-IL')}
- בקשה: "${userInput}"
- משימות פתוחות: ${context.pendingTasks?.length || 0}

התנהג כמו עוזר אישי שמכיר אותו היטב. אל תהיה רובוט - היה אמיתי וחכם.
אם הוא מבקש ליצור משימה, השתמש בפורמט: [CREATE_TASK:שם|תיאור|עדיפות]
`;
  }

  // 🎯 ניתוח חכם של שעות פרודקטיביות
  private static analyzeProductiveHours(tasks: Task[]): string {
    const hourStats = new Map<number, number>();
    
    tasks.filter(t => t.completed && t.updatedAt).forEach(task => {
      const hour = new Date(task.updatedAt!).getHours();
      hourStats.set(hour, (hourStats.get(hour) || 0) + 1);
    });

    const sortedHours = Array.from(hourStats.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    if (sortedHours.length === 0) return 'לא נאספו נתונים עדיין';
    
    return `הכי פרודקטיבי בשעות: ${sortedHours.map(([hour]) => 
      `${hour}:00-${hour+1}:00`).join(', ')}`;
  }

  // ⏱️ למידת זמני משימות אמיתיים
  private static analyzeTaskDurations(tasks: Task[]): Map<string, number> {
    const durations = new Map<string, number[]>();
    
    tasks.filter(t => t.completed && t.createdAt && t.updatedAt).forEach(task => {
      const duration = new Date(task.updatedAt!).getTime() - new Date(task.createdAt).getTime();
      const durationMinutes = Math.round(duration / (1000 * 60));
      
      // קטגוריזציה לפי מילות מפתח
      const category = this.categorizeTask(task.title);
      
      if (!durations.has(category)) {
        durations.set(category, []);
      }
      durations.get(category)!.push(durationMinutes);
    });

    // חישוב ממוצע לכל קטגוריה
    const averages = new Map<string, number>();
    durations.forEach((times, category) => {
      const average = times.reduce((a, b) => a + b, 0) / times.length;
      averages.set(category, Math.round(average));
    });

    return averages;
  }

  // 🗣️ למידת דפוסי שפה
  private static analyzeUserPhrases(interactions: any[]): Map<string, string[]> {
    const phrases = new Map<string, string[]>();
    
    interactions.forEach(interaction => {
      if (interaction.type === 'task_creation') {
        const category = this.categorizeTask(interaction.content);
        
        if (!phrases.has(category)) {
          phrases.set(category, []);
        }
        
        phrases.get(category)!.push(interaction.content);
      }
    });

    return phrases;
  }

  // 🏷️ קטגוריזציה חכמה של משימות
  private static categorizeTask(title: string): string {
    const categories = {
      'קניות': /(קנ|חנות|סופר|קוני|רכיש)/i,
      'בית': /(בית|ניקיון|סידור|כביסה|מטבח)/i,
      'עבודה': /(עבודה|פרויקט|מצגת|דוח|פגישה|משרד)/i,
      'בריאות': /(רופא|תור|ספורט|כושר|בריאות|מחלה)/i,
      'אישי': /(התקשר|פגש|מכתב|אימייל|צלצל)/i,
      'לימודים': /(לימוד|בחינה|קורס|ספר|מחקר)/i,
      'רכב': /(מכונית|רכב|דלק|צמיגים|מוסך)/i
    };

    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(title)) {
        return category;
      }
    }
    
    return 'כללי';
  }

  // 🚨 זיהוי דחיינות וטיפול בה
  private static analyzeProcrastination(tasks: Task[]): string[] {
    const now = new Date();
    const procrastinatedTasks = tasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      
      const dueDate = new Date(task.dueDate);
      const daysPast = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
      
      return daysPast > 1; // משימות שעברו יותר מיום
    });

    const patterns = procrastinatedTasks.map(task => this.categorizeTask(task.title));
    const frequency = new Map<string, number>();
    
    patterns.forEach(pattern => {
      frequency.set(pattern, (frequency.get(pattern) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .sort(([,a], [,b]) => b - a)
      .map(([pattern]) => pattern);
  }

  // 🔗 זיהוי קשרים בין משימות
  private static analyzeTaskRelationships(tasks: Task[]): Map<string, string[]> {
    const relationships = new Map<string, string[]>();
    
    const completedTasks = tasks.filter(t => t.completed && t.updatedAt).sort(
      (a, b) => new Date(a.updatedAt!).getTime() - new Date(b.updatedAt!).getTime()
    );

    for (let i = 0; i < completedTasks.length - 1; i++) {
      const current = this.categorizeTask(completedTasks[i].title);
      const next = this.categorizeTask(completedTasks[i + 1].title);
      
      const timeDiff = new Date(completedTasks[i + 1].updatedAt!).getTime() - 
                      new Date(completedTasks[i].updatedAt!).getTime();
      
      // אם המשימות הושלמו תוך שעה אחת זו מזה
      if (timeDiff < 3600000) {
        if (!relationships.has(current)) {
          relationships.set(current, []);
        }
        relationships.get(current)!.push(next);
      }
    }

    return relationships;
  }
}