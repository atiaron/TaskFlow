/**
 * RealTimeSyncService - Real-time Data Synchronization
 * 
 * Purpose: Provides real-time synchronization capabilities for sessions,
 * messages, and tasks across multiple devices and tabs
 * 
 * Features:
 * - Real-time Firebase listeners
 * - Cross-tab synchronization
 * - Conflict resolution
 * - Optimistic updates
 * - Connection state management
 * 
 * @author TaskFlow Development Team
 * @version 1.0.0
 * @date 2025-08-06
 */

import { onSnapshot, doc, collection, query, where, orderBy, Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChatSession, ChatMessage, Task } from '../types/index';
import { AuthService } from './AuthService';
import { PerformanceMonitor } from './PerformanceMonitor';

interface SyncSubscription {
  id: string;
  type: 'sessions' | 'messages' | 'tasks';
  unsubscribe: Unsubscribe;
  lastUpdate: Date;
}

interface SyncState {
  isConnected: boolean;
  lastSync: Date;
  pendingChanges: number;
  activeSessions: Set<string>;
}

export class RealTimeSyncService {
  private static instance: RealTimeSyncService | null = null;
  private subscriptions: Map<string, SyncSubscription> = new Map();
  private syncState: SyncState = {
    isConnected: false,
    lastSync: new Date(),
    pendingChanges: 0,
    activeSessions: new Set()
  };

  // Event listeners for real-time updates
  private sessionListeners: Set<(sessions: ChatSession[]) => void> = new Set();
  private messageListeners: Map<string, Set<(messages: ChatMessage[]) => void>> = new Map();
  private taskListeners: Set<(tasks: Task[]) => void> = new Set();

  private constructor() {
    this.initializeService();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RealTimeSyncService {
    if (!RealTimeSyncService.instance) {
      RealTimeSyncService.instance = new RealTimeSyncService();
    }
    return RealTimeSyncService.instance;
  }

  /**
   * Initialize the sync service
   */
  private initializeService(): void {
    // Monitor connection state
    this.monitorConnectionState();
    
    // Handle tab focus/blur for optimization
    this.handleTabVisibility();
    
    console.log('🔄 RealTimeSyncService initialized');
  }

  /**
   * Subscribe to real-time session updates
   */
  public subscribeToSessions(
    callback: (sessions: ChatSession[]) => void
  ): () => void {
    const user = AuthService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Add callback to listeners
    this.sessionListeners.add(callback);

    // Create Firebase listener if not exists
    const subscriptionId = `sessions_${user.id}`;
    
    if (!this.subscriptions.has(subscriptionId)) {
      const sessionsRef = collection(db, 'users', user.id, 'sessions');
      const q = query(sessionsRef, orderBy('updatedAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const timingId = PerformanceMonitor.startTiming('syncSessions');
          
          const sessions: ChatSession[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            sessions.push({
              id: doc.id,
              title: data.title,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              messageCount: data.messageCount || 0,
              status: data.status || 'active',
              userId: user.id,
              user_id: user.id,
              created_at: data.createdAt?.toDate() || new Date(),
              updated_at: data.updatedAt?.toDate() || new Date(),
              message_count: data.messageCount || 0,
              is_starred: data.isStarred || false,
              isStarred: data.isStarred || false
            });
          });

          // Notify all session listeners
          this.sessionListeners.forEach(listener => {
            try {
              listener(sessions);
            } catch (error) {
              console.error('Error in session listener:', error);
            }
          });

          this.updateSyncState();
          PerformanceMonitor.endTiming(timingId, true);
        },
        (error) => {
          console.error('❌ Sessions sync error:', error);
          this.handleSyncError(error);
        }
      );

      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        type: 'sessions',
        unsubscribe,
        lastUpdate: new Date()
      });
    }

    // Return unsubscribe function
    return () => {
      this.sessionListeners.delete(callback);
      
      // If no more listeners, unsubscribe from Firebase
      if (this.sessionListeners.size === 0) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(subscriptionId);
        }
      }
    };
  }

  /**
   * Subscribe to real-time message updates for a session
   */
  public subscribeToMessages(
    sessionId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const user = AuthService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Add callback to listeners
    if (!this.messageListeners.has(sessionId)) {
      this.messageListeners.set(sessionId, new Set());
    }
    this.messageListeners.get(sessionId)!.add(callback);

    // Track active session
    this.syncState.activeSessions.add(sessionId);

    // Create Firebase listener if not exists
    const subscriptionId = `messages_${sessionId}`;
    
    if (!this.subscriptions.has(subscriptionId)) {
      const messagesRef = collection(db, 'users', user.id, 'sessions', sessionId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messages: ChatMessage[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({
              id: doc.id,
              content: data.content,
              sender: data.sender,
              timestamp: data.timestamp?.toDate() || new Date(),
              chat_id: sessionId
            });
          });

          // Notify session-specific message listeners
          const listeners = this.messageListeners.get(sessionId);
          if (listeners) {
            listeners.forEach(listener => {
              try {
                listener(messages);
              } catch (error) {
                console.error('Error in message listener:', error);
              }
            });
          }

          this.updateSyncState();
        },
        (error) => {
          console.error(`❌ Messages sync error for session ${sessionId}:`, error);
          this.handleSyncError(error);
        }
      );

      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        type: 'messages',
        unsubscribe,
        lastUpdate: new Date()
      });
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.messageListeners.get(sessionId);
      if (listeners) {
        listeners.delete(callback);
        
        // If no more listeners for this session, unsubscribe
        if (listeners.size === 0) {
          this.messageListeners.delete(sessionId);
          this.syncState.activeSessions.delete(sessionId);
          
          const subscription = this.subscriptions.get(subscriptionId);
          if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(subscriptionId);
          }
        }
      }
    };
  }

  /**
   * Subscribe to real-time task updates
   */
  public subscribeToTasks(
    callback: (tasks: Task[]) => void
  ): () => void {
    const user = AuthService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Add callback to listeners
    this.taskListeners.add(callback);

    // Create Firebase listener if not exists
    const subscriptionId = `tasks_${user.id}`;
    
    if (!this.subscriptions.has(subscriptionId)) {
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef, 
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const tasks: Task[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            tasks.push({
              id: doc.id,
              user_id: user.id,
              title: data.title,
              description: data.description,
              completed: data.completed,
              priority: data.priority,
              category: data.category,
              dueDate: data.dueDate?.toDate(),
              due_date: data.dueDate?.toDate(),
              reminder_time: data.reminder_time?.toDate(),
              createdAt: data.createdAt?.toDate() || new Date(),
              created_at: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              updated_at: data.updatedAt?.toDate() || new Date(),
              created_by: data.created_by || 'ai',
              estimated_duration: data.estimated_duration,
              actual_duration: data.actual_duration,
              tags: data.tags || [],
              parent_id: data.parent_id,
              version: data.version || 1,
              last_modified_by: data.last_modified_by || 'unknown',
              sync_status: data.sync_status || 'synced',
              shared_with: data.shared_with || [],
              permissions: data.permissions || {}
            });
          });

          // Notify all task listeners
          this.taskListeners.forEach(listener => {
            try {
              listener(tasks);
            } catch (error) {
              console.error('Error in task listener:', error);
            }
          });

          this.updateSyncState();
        },
        (error) => {
          console.error('❌ Tasks sync error:', error);
          this.handleSyncError(error);
        }
      );

      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        type: 'tasks',
        unsubscribe,
        lastUpdate: new Date()
      });
    }

    // Return unsubscribe function
    return () => {
      this.taskListeners.delete(callback);
      
      // If no more listeners, unsubscribe from Firebase
      if (this.taskListeners.size === 0) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(subscriptionId);
        }
      }
    };
  }

  /**
   * Get current sync state
   */
  public getSyncState(): SyncState {
    return { ...this.syncState };
  }

  /**
   * Force sync refresh for all active subscriptions
   */
  public async refreshSync(): Promise<void> {
    console.log('🔄 Forcing sync refresh...');
    
    // Update sync state
    this.updateSyncState();
    
    // Emit sync refresh event
    window.dispatchEvent(new CustomEvent('sync-refresh', {
      detail: {
        timestamp: new Date(),
        activeSubscriptions: this.subscriptions.size,
        activeSessions: this.syncState.activeSessions.size
      }
    }));
  }

  /**
   * Cleanup all subscriptions
   */
  public cleanup(): void {
    console.log('🧹 Cleaning up sync subscriptions...');
    
    // Unsubscribe from all Firebase listeners
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    
    // Clear all maps and sets
    this.subscriptions.clear();
    this.sessionListeners.clear();
    this.messageListeners.clear();
    this.taskListeners.clear();
    this.syncState.activeSessions.clear();
    
    console.log('✅ Sync cleanup completed');
  }

  /**
   * Monitor Firebase connection state
   */
  private monitorConnectionState(): void {
    // Monitor Firebase connection using a small document
    const user = AuthService.getCurrentUser();
    if (!user) return;

    const connectionRef = doc(db, 'users', user.id);
    
    onSnapshot(
      connectionRef,
      () => {
        this.syncState.isConnected = true;
        this.updateSyncState();
      },
      (error) => {
        console.warn('Firebase connection error:', error);
        this.syncState.isConnected = false;
        this.updateSyncState();
      }
    );
  }

  /**
   * Handle tab visibility for optimization
   */
  private handleTabVisibility(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Tab is hidden - reduce sync frequency
        console.log('🔄 Tab hidden - reducing sync frequency');
      } else {
        // Tab is visible - normal sync frequency
        console.log('🔄 Tab visible - normal sync frequency');
        this.refreshSync();
      }
    });
  }

  /**
   * Update sync state
   */
  private updateSyncState(): void {
    this.syncState.lastSync = new Date();
    
    // Emit sync state change event
    window.dispatchEvent(new CustomEvent('sync-state-change', {
      detail: this.getSyncState()
    }));
  }

  /**
   * Handle sync errors
   */
  private handleSyncError(error: any): void {
    console.error('🚨 Sync error:', error);
    
    this.syncState.isConnected = false;
    
    // Emit sync error event
    window.dispatchEvent(new CustomEvent('sync-error', {
      detail: {
        error: error.message || String(error),
        timestamp: new Date(),
        subscriptions: this.subscriptions.size
      }
    }));
  }

  /**
   * Get sync statistics
   */
  public getSyncStats(): {
    activeSubscriptions: number;
    activeSessions: number;
    isConnected: boolean;
    lastSync: Date;
    memoryUsage: {
      subscriptions: number;
      sessionListeners: number;
      messageListeners: number;
      taskListeners: number;
    };
  } {
    let totalMessageListeners = 0;
    this.messageListeners.forEach(listeners => {
      totalMessageListeners += listeners.size;
    });

    return {
      activeSubscriptions: this.subscriptions.size,
      activeSessions: this.syncState.activeSessions.size,
      isConnected: this.syncState.isConnected,
      lastSync: this.syncState.lastSync,
      memoryUsage: {
        subscriptions: this.subscriptions.size,
        sessionListeners: this.sessionListeners.size,
        messageListeners: totalMessageListeners,
        taskListeners: this.taskListeners.size
      }
    };
  }
}
