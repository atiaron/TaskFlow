/* cspell:disable */
import { Task } from '../types';
import { FirebaseService } from './FirebaseService';
import { AuthService } from './AuthService';

export class NotificationService {
  private static instance: NotificationService;
  private notificationQueue: Array<{
    task: any;
    type: 'reminder' | 'deadline' | 'celebration';
    scheduledTime: Date;
  }> = [];
  private vapidKey: string | null = null; // Will be set from Firebase config

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  constructor() {
    this.setupNotificationActions();
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        this.showWelcomeNotification();
      }
      
      return permission === 'granted';
    }

    return false;
  }

  private showWelcomeNotification(): void {
    this.showNotification({
      title: '🎉 ברוך הבא ל-TaskFlow!',
      body: 'התראות הופעלו בהצלחה. תקבל תזכורות על משימות חשובות.',
      icon: '/icons/icon-192x192.png',
      tag: 'welcome',
      requireInteraction: false
    });
  }

  // PWA Notification methods
  showInstallPrompt(): void {
    this.showNotification({
      title: '📱 התקן את TaskFlow',
      body: 'קבל גישה מהירה וחוויה טובה יותר עם אפליקציית TaskFlow',
      icon: '/icons/icon-192x192.png',
      tag: 'install-prompt',
      requireInteraction: true,
      actions: [
        { action: 'install', title: 'התקן עכשיו' },
        { action: 'dismiss', title: 'אולי מאוחר יותר' }
      ]
    });
  }

  showOfflineNotification(): void {
    this.showNotification({
      title: '📱 TaskFlow עובד אופליין',
      body: 'אתה יכול להמשיך לעבוד. הנתונים יסונכרנו כשהאינטרנט יחזור.',
      icon: '/icons/icon-192x192.png',
      tag: 'offline-mode',
      requireInteraction: false
    });
  }

  showOnlineNotification(): void {
    this.showNotification({
      title: '🌐 חזרת אונליין!',
      body: 'TaskFlow מסנכרן את הנתונים שלך עכשיו.',
      icon: '/icons/icon-192x192.png',
      tag: 'online-mode',
      requireInteraction: false
    });
  }

  showSyncCompleteNotification(itemCount: number): void {
    this.showNotification({
      title: '✅ סנכרון הושלם',
      body: `${itemCount} פריטים סונכרנו בהצלחה.`,
      icon: '/icons/icon-192x192.png',
      tag: 'sync-complete',
      requireInteraction: false
    });
  }

  showUpdateAvailableNotification(): void {
    this.showNotification({
      title: '🔄 עדכון זמין',
      body: 'גרסה חדשה של TaskFlow זמינה. רענן את הדף כדי לקבל את העדכון.',
      icon: '/icons/icon-192x192.png',
      tag: 'update-available',
      requireInteraction: true,
      actions: [
        { action: 'update', title: 'עדכן עכשיו' },
        { action: 'later', title: 'מאוחר יותר' }
      ]
    });
  }

  async scheduleTaskReminder(task: any, minutesBefore: number = 60) {
    if (!await this.requestPermission()) {
      console.log('Notifications not permitted');
      return;
    }

    if (!task.dueDate) {
      console.log('Task has no due date');
      return;
    }

    const reminderTime = new Date(task.dueDate);
    reminderTime.setMinutes(reminderTime.getMinutes() - minutesBefore);

    const now = new Date();
    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    if (timeUntilReminder > 0) {
      setTimeout(() => {
        this.showNotification({
          title: '⏰ תזכורת משימה',
          body: `"${task.title}" מתקרבת! (בעוד ${minutesBefore} דקות)`,
          icon: '/icon-192x192.png',
          tag: `reminder-${task.id}`,
          requireInteraction: true,
          actions: [
            { action: 'complete', title: '✅ סמן כהושלם' },
            { action: 'snooze', title: '⏰ דחה ב-15 דקות' },
            { action: 'open', title: '📖 פתח אפליקציה' }
          ]
        });
      }, timeUntilReminder);

      this.notificationQueue.push({
        task,
        type: 'reminder',
        scheduledTime: reminderTime
      });

      console.log(`⏰ Reminder scheduled for ${task.title} at ${reminderTime}`);
    }
  }

  async scheduleDeadlineAlert(task: any) {
    if (!await this.requestPermission()) return;
    if (!task.dueDate) return;

    const now = new Date();
    const timeUntilDeadline = new Date(task.dueDate).getTime() - now.getTime();

    if (timeUntilDeadline > 0) {
      setTimeout(() => {
        this.showNotification({
          title: '🚨 מועד אחרון!',
          body: `"${task.title}" אמור להיות מוגש עכשיו!`,
          icon: '/icon-192x192.png',
          tag: `deadline-${task.id}`,
          requireInteraction: true,
          actions: [
            { action: 'complete', title: '✅ סמן כהושלם' },
            { action: 'snooze', title: '⏰ דחה ב-15 דקות' }
          ]
        });
      }, timeUntilDeadline);
    }
  }

  showCelebration(task: any) {
    this.showNotification({
      title: '🎉 כל הכבוד!',
      body: `השלמת את "${task.title}"! ${this.getRandomCelebration()}`,
      icon: '/icon-192x192.png',
      tag: `celebration-${task.id}`,
      requireInteraction: false
    });

    // 🎊 אפקט ויזואלי נוסף אם האפליקציה פתוחה
    if (document.hasFocus()) {
      this.triggerConfetti();
    }
  }

  private getRandomCelebration(): string {
    const celebrations = [
      'אתה מדהים! 🌟',
      'עוד אחת בכיס! 💪',
      'פרודקטיביות ברמה גבוהה! 🚀',
      'כמו שצריך! 👏',
      'תמשיך ככה! 🔥',
      'מצוין! 🎯',
      'אלוף! 🏆',
      'מטריף! ⭐'
    ];
    
    return celebrations[Math.floor(Math.random() * celebrations.length)];
  }

  private showNotification(options: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
    actions?: Array<{ action: string; title: string; }>;
  }) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        badge: '/icon-192x192.png',
        silent: false
      });

      // 🎯 טיפול בלחיצה על ההתראה
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 🎯 סגירה אוטומטית אחרי 10 שניות (אלא אם דרוש אינטראקציה)
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }
    }
  }

  private triggerConfetti() {
    // 🎊 אפקט קונפטי פשוט (אם יש ספריית confetti)
    if ('confetti' in window) {
      (window as any).confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }

  // 🎯 טיפול בפעולות מההתראות (דרך Service Worker)
  setupNotificationActions() {
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
    // Logic for completing task from notification
    try {
      const currentUser = AuthService.getCurrentUser();
      
      if (!currentUser) {
        console.error('No user logged in');
        return;
      }

      await FirebaseService.updateTask(currentUser.id, taskId, { completed: true });
      this.showCelebration({ id: taskId, title: 'Task completed!' });
    } catch (error) {
      console.error('Error completing task:', error);
    }
  }

  private async handleSnoozeTask(taskId: string) {
    // Snooze task for 15 minutes
    try {
      const currentUser = AuthService.getCurrentUser();
      
      if (!currentUser) {
        console.error('No user logged in');
        return;
      }
      
      const task = await FirebaseService.getTask(currentUser.id, taskId);
      if (task && task.dueDate) {
        const newDueDate = new Date(task.dueDate);
        newDueDate.setMinutes(newDueDate.getMinutes() + 15);
        
        await FirebaseService.updateTask(currentUser.id, taskId, { 
          ...task, 
          dueDate: newDueDate 
        });
        this.scheduleTaskReminder(task, 15);
        
        this.showNotification({
          title: '⏰ משימה נדחתה',
          body: `"${task.title}" נדחתה ב-15 דקות`,
          icon: '/icon-192x192.png',
          tag: `snooze-${taskId}`
        });
      }
    } catch (error) {
      console.error('Error snoozing task:', error);
    }
  }

  // 🎯 ניקוי התראות ישנות
  clearOldNotifications() {
    const now = new Date();
    this.notificationQueue = this.notificationQueue.filter(
      notification => notification.scheduledTime > now
    );
  }

  // 🎯 קבלת סטטיסטיקות התראות
  getNotificationStats() {
    return {
      pending: this.notificationQueue.length,
      types: this.notificationQueue.reduce((acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}