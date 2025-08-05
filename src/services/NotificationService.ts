export class NotificationService {
  private static instance: NotificationService;
  private notificationQueue: Array<{
    task: any;
    type: 'reminder' | 'deadline' | 'celebration';
    scheduledTime: Date;
  }> = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('❌ Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async scheduleTaskReminder(task: any, minutesBefore: number = 60) {
    if (!task.dueDate || !await this.requestPermission()) {
      return;
    }

    const reminderTime = new Date(task.dueDate);
    reminderTime.setMinutes(reminderTime.getMinutes() - minutesBefore);

    const timeUntilReminder = reminderTime.getTime() - Date.now();

    if (timeUntilReminder > 0) {
      this.notificationQueue.push({
        task,
        type: 'reminder',
        scheduledTime: reminderTime
      });

      setTimeout(() => {
        this.showNotification({
          title: `⏰ תזכורת: ${task.title}`,
          body: task.description || 'המשימה מתקרבת!',
          icon: '/icon-192x192.png',
          tag: `reminder-${task.id}`,
          actions: [
            { action: 'complete', title: 'סמן כהושלם' },
            { action: 'snooze', title: 'דחה ב-15 דק' },
            { action: 'open', title: 'פתח אפליקציה' }
          ]
        });
      }, timeUntilReminder);
    }
  }

  async scheduleDeadlineAlert(task: any) {
    if (!task.dueDate || !await this.requestPermission()) {
      return;
    }

    const alertTime = new Date(task.dueDate);
    const timeUntilDeadline = alertTime.getTime() - Date.now();

    if (timeUntilDeadline > 0) {
      setTimeout(() => {
        this.showNotification({
          title: `🚨 דדליין: ${task.title}`,
          body: 'המשימה צריכה להיות מוכנה עכשיו!',
          icon: '/icon-192x192.png',
          tag: `deadline-${task.id}`,
          requireInteraction: true,
          actions: [
            { action: 'complete', title: 'השלמתי!' },
            { action: 'extend', title: 'דחה למחר' }
          ]
        });
      }, timeUntilDeadline);
    }
  }

  showCelebration(task: any) {
    this.showNotification({
      title: `🎉 כל הכבוד!`,
      body: `השלמת את "${task.title}" - אתה מדהים!`,
      icon: '/icon-192x192.png',
      tag: `celebration-${task.id}`,
      vibrate: [100, 50, 100, 50, 100]
    });
  }

  showDailyMotivation(completedToday: number, totalToday: number) {
    let message = '';
    let emoji = '';

    if (completedToday === 0) {
      message = 'בוקר טוב! בואו נתחיל את היום עם משימה קטנה';
      emoji = '🌅';
    } else if (completedToday === totalToday) {
      message = 'מדהים! השלמת את כל המשימות היום!';
      emoji = '🏆';
    } else {
      const percentage = Math.round((completedToday / totalToday) * 100);
      message = `כל הכבוד! השלמת ${percentage}% מהמשימות היום`;
      emoji = '💪';
    }

    this.showNotification({
      title: `${emoji} עדכון יומי`,
      body: message,
      icon: '/icon-192x192.png',
      tag: 'daily-motivation'
    });
  }

  showWeeklyReport(weeklyStats: any) {
    const { completed, total, streak } = weeklyStats;
    
    this.showNotification({
      title: '📊 דוח שבועי',
      body: `השבוע השלמת ${completed}/${total} משימות. רצף נוכחי: ${streak} ימים!`,
      icon: '/icon-192x192.png',
      tag: 'weekly-report',
      actions: [
        { action: 'view-report', title: 'ראה דוח מלא' },
        { action: 'plan-next-week', title: 'תכנן שבוע הבא' }
      ]
    });
  }

  showSmartSuggestion(suggestion: string) {
    this.showNotification({
      title: '💡 הצעה חכמה',
      body: suggestion,
      icon: '/icon-192x192.png',
      tag: 'smart-suggestion',
      actions: [
        { action: 'accept', title: 'בצע' },
        { action: 'dismiss', title: 'התעלם' }
      ]
    });
  }

  private showNotification(options: NotificationOptions & { title: string }) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(options.title, {
        ...options,
        badge: '/icon-192x192.png',
        timestamp: Date.now()
      });

      // סגור אוטומטית אחרי 10 שניות (אלא אם requireInteraction = true)
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 10000);
      }

      return notification;
    }
  }

  // הוספת listener לפעולות על התראות
  setupNotificationHandlers() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        const { action, taskId } = event.data;
        
        switch (action) {
          case 'complete':
            this.handleCompleteTask(taskId);
            break;
          case 'snooze':
            this.handleSnoozeTask(taskId);
            break;
          case 'open':
            window.focus();
            break;
        }
      });
    }
  }

  private async handleCompleteTask(taskId: string) {
    // לוגיקה להשלמת משימה מההתראה
    try {
      const { StorageService } = await import('./StorageService');
      const task = await StorageService.getTask(taskId);
      if (task) {
        await StorageService.updateTask(taskId, { ...task, completed: true });
        this.showCelebration(task);
      }
    } catch (error) {
      console.error('Failed to complete task from notification:', error);
    }
  }

  private async handleSnoozeTask(taskId: string) {
    // דחיית משימה ב-15 דקות
    try {
      const { StorageService } = await import('./StorageService');
      const task = await StorageService.getTask(taskId);
      if (task && task.dueDate) {
        const newDueDate = new Date(task.dueDate);
        newDueDate.setMinutes(newDueDate.getMinutes() + 15);
        
        await StorageService.updateTask(taskId, { ...task, dueDate: newDueDate });
        this.scheduleTaskReminder(task, 15);
        
        this.showNotification({
          title: '⏰ משימה נדחתה',
          body: `"${task.title}" נדחתה ב-15 דקות`,
          icon: '/icon-192x192.png',
          tag: `snooze-${taskId}`
        });
      }
    } catch (error) {
      console.error('Failed to snooze task:', error);
    }
  }
}