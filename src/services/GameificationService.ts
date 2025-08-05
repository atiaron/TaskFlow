interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface UserStats {
  level: number;
  totalPoints: number;
  tasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  weeklyGoal: number;
  monthlyGoal: number;
}

export class GameificationService {
  private static instance: GameificationService;
  
  static getInstance(): GameificationService {
    if (!GameificationService.instance) {
      GameificationService.instance = new GameificationService();
    }
    return GameificationService.instance;
  }

  private achievements: Achievement[] = [
    {
      id: 'first_task',
      title: 'צעדים ראשונים',
      description: 'השלמת את המשימה הראשונה שלך',
      icon: '🎯',
      points: 10,
      unlocked: false
    },
    {
      id: 'daily_hero',
      title: 'גיבור יומי',
      description: 'השלמת 5 משימות ביום אחד',
      icon: '🦸‍♂️',
      points: 50,
      unlocked: false
    },
    {
      id: 'week_warrior',
      title: 'לוחם השבוע',
      description: 'השלמת 20 משימות בשבוע',
      icon: '⚔️',
      points: 100,
      unlocked: false
    },
    {
      id: 'streak_master',
      title: 'מאסטר הרצף',
      description: 'רצף של 7 ימים עם לפחות משימה אחת',
      icon: '🔥',
      points: 75,
      unlocked: false
    },
    {
      id: 'early_bird',
      title: 'ציפור מוקדמת',
      description: 'השלמת משימה לפני 8:00 בבוקר',
      icon: '🌅',
      points: 25,
      unlocked: false
    },
    {
      id: 'night_owl',
      title: 'ינשוף לילה',
      description: 'השלמת משימה אחרי 22:00',
      icon: '🦉',
      points: 25,
      unlocked: false
    },
    {
      id: 'perfectionist',
      title: 'פרפקציוניסט',
      description: 'השלמת כל המשימות ביום',
      icon: '💎',
      points: 100,
      unlocked: false
    },
    {
      id: 'ai_friend',
      title: 'חבר של AI',
      description: 'השתמשת בעוזר החכם 10 פעמים',
      icon: '🤖',
      points: 30,
      unlocked: false
    },
    {
      id: 'planner',
      title: 'תכנן מקצועי',
      description: 'תכננת 50 משימות עם תאריכי יעד',
      icon: '📅',
      points: 75,
      unlocked: false
    },
    {
      id: 'legend',
      title: 'אגדה חיה',
      description: 'השלמת 1000 משימות',
      icon: '👑',
      points: 500,
      unlocked: false
    }
  ];

  async checkAchievements(userStats: UserStats, tasks: any[]): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];
    
    for (const achievement of this.achievements) {
      if (!achievement.unlocked && this.checkAchievementCondition(achievement.id, userStats, tasks)) {
        achievement.unlocked = true;
        achievement.unlockedAt = new Date();
        newAchievements.push(achievement);
        
        // שמור בlocalStorage
        await this.saveAchievement(achievement);
        
        // הצג התראה
        this.showAchievementNotification(achievement);
      }
    }
    
    return newAchievements;
  }

  private checkAchievementCondition(achievementId: string, stats: UserStats, tasks: any[]): boolean {
    const completedTasks = tasks.filter(t => t.completed);
    const today = new Date().toDateString();
    const thisWeek = this.getWeekTasks(tasks);
    
    switch (achievementId) {
      case 'first_task':
        return completedTasks.length >= 1;
        
      case 'daily_hero':
        const todayCompleted = completedTasks.filter(t => 
          new Date(t.updatedAt).toDateString() === today
        );
        return todayCompleted.length >= 5;
        
      case 'week_warrior':
        const weekCompleted = thisWeek.filter(t => t.completed);
        return weekCompleted.length >= 20;
        
      case 'streak_master':
        return stats.currentStreak >= 7;
        
      case 'early_bird':
        return completedTasks.some(t => {
          const hour = new Date(t.updatedAt).getHours();
          return hour < 8;
        });
        
      case 'night_owl':
        return completedTasks.some(t => {
          const hour = new Date(t.updatedAt).getHours();
          return hour >= 22;
        });
        
      case 'perfectionist':
        const todayTasks = tasks.filter(t => 
          t.dueDate && new Date(t.dueDate).toDateString() === today
        );
        return todayTasks.length > 0 && todayTasks.every(t => t.completed);
        
      case 'ai_friend':
        // זה יחשב מהשימוש בצ'אט
        return this.getAIUsageCount() >= 10;
        
      case 'planner':
        const tasksWithDueDate = tasks.filter(t => t.dueDate);
        return tasksWithDueDate.length >= 50;
        
      case 'legend':
        return stats.tasksCompleted >= 1000;
        
      default:
        return false;
    }
  }

  private getWeekTasks(tasks: any[]): any[] {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return tasks.filter(t => 
      t.createdAt && new Date(t.createdAt) >= oneWeekAgo
    );
  }

  private getAIUsageCount(): number {
    return parseInt(localStorage.getItem('ai_usage_count') || '0');
  }

  incrementAIUsage() {
    const current = this.getAIUsageCount();
    localStorage.setItem('ai_usage_count', (current + 1).toString());
  }

  private async saveAchievement(achievement: Achievement) {
    const saved = JSON.parse(localStorage.getItem('achievements') || '[]');
    saved.push(achievement);
    localStorage.setItem('achievements', JSON.stringify(saved));
  }

  async getUserStats(tasks: any[]): Promise<UserStats> {
    const completedTasks = tasks.filter(t => t.completed);
    const totalPoints = this.calculatePoints(completedTasks);
    
    return {
      level: Math.floor(totalPoints / 100) + 1,
      totalPoints,
      tasksCompleted: completedTasks.length,
      currentStreak: this.calculateCurrentStreak(tasks),
      longestStreak: this.calculateLongestStreak(tasks),
      weeklyGoal: 20,
      monthlyGoal: 80
    };
  }

  private calculatePoints(completedTasks: any[]): number {
    return completedTasks.reduce((total, task) => {
      let points = 10; // נקודות בסיס
      
      // בונוס לפי עדיפות
      if (task.priority === 'high') points += 15;
      else if (task.priority === 'medium') points += 10;
      else points += 5;
      
      // בונוס לזמן השלמה
      if (task.dueDate && task.updatedAt) {
        const completed = new Date(task.updatedAt);
        const due = new Date(task.dueDate);
        if (completed <= due) points += 5; // בזמן
        if (completed < due) points += 10; // מוקדם
      }
      
      return total + points;
    }, 0);
  }

  private calculateCurrentStreak(tasks: any[]): number {
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      const dayTasks = tasks.filter(t => 
        t.completed && 
        new Date(t.updatedAt).toDateString() === checkDate.toDateString()
      );
      
      if (dayTasks.length > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private calculateLongestStreak(tasks: any[]): number {
    const completionDates = tasks
      .filter(t => t.completed && t.updatedAt)
      .map(t => new Date(t.updatedAt).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort();
    
    let longestStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < completionDates.length; i++) {
      const prevDate = new Date(completionDates[i - 1]);
      const currDate = new Date(completionDates[i]);
      const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    }
    
    return Math.max(longestStreak, currentStreak);
  }

  private showAchievementNotification(achievement: Achievement) {
    if (Notification.permission === 'granted') {
      new Notification(`🏆 הישג חדש!`, {
        body: `${achievement.icon} ${achievement.title}\n${achievement.description}\n+${achievement.points} נקודות!`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: `achievement-${achievement.id}`,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200]
      });
    }
  }

  getProgressToNextLevel(currentPoints: number): { current: number; needed: number; percentage: number } {
    const currentLevel = Math.floor(currentPoints / 100);
    const pointsToNextLevel = ((currentLevel + 1) * 100) - currentPoints;
    const progressInLevel = currentPoints % 100;
    
    return {
      current: progressInLevel,
      needed: pointsToNextLevel,
      percentage: (progressInLevel / 100) * 100
    };
  }
}