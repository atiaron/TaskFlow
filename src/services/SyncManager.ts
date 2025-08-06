/**
 * SyncManager - Real-time Multi-Device Synchronization
 * מסמך מקור: SYSTEM_DESIGN_AND_IMPROVEMENTS_2025.md
 * תאריך יצירה: 6 באוגוסט 2025
 * 
 * ניהול סנכרון בזמן אמת:
 * - Multi-device session sync
 * - Real-time message updates
 * - Conflict resolution
 * - Offline support preparation
 * - Event-driven architecture
 */

import { ChatMessage } from '../types';
import { ChatSession } from '../types/sessions';
import { FirebaseService } from './FirebaseService';
import { StorageService } from './StorageService';
import { AuthService } from './AuthService';

export interface SyncEvent {
  type: 'sessions-updated' | 'messages-updated' | 'session-changed' | 'conflict-detected';
  data: any;
  timestamp: Date;
  deviceId?: string;
}

export interface ConflictResolution {
  strategy: 'timestamp' | 'user_decision' | 'merge' | 'latest_wins';
  winner: ChatMessage;
  loser: ChatMessage;
  resolved: ChatMessage;
}

export class SyncManager {
  private static sessionListeners: Map<string, () => void> = new Map();
  private static messageListeners: Map<string, () => void> = new Map();
  private static isInitialized: boolean = false;
  private static currentUserId: string | null = null;
  private static deviceId: string = this.generateDeviceId();

  // ✅ INITIALIZATION & CLEANUP
  static initializeSync(userId?: string): void {
    try {
      const targetUserId = userId || AuthService.getCurrentUser()?.id;
      if (!targetUserId) {
        console.warn('⚠️ Cannot initialize sync: No user ID');
        return;
      }

      if (this.isInitialized && this.currentUserId === targetUserId) {
        console.log('🔄 Sync already initialized for user:', targetUserId);
        return;
      }

      // Cleanup previous sync if exists
      if (this.isInitialized) {
        this.cleanup();
      }

      console.log('🚀 Initializing real-time sync for user:', targetUserId);
      this.currentUserId = targetUserId;

      // Subscribe to sessions changes
      this.initializeSessionsSync(targetUserId);
      
      // Subscribe to active session messages
      this.initializeActiveSessionSync(targetUserId);
      
      this.isInitialized = true;
      console.log('✅ Real-time sync initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing sync:', error);
    }
  }

  private static initializeSessionsSync(userId: string): void {
    const sessionsUnsubscribe = FirebaseService.subscribeToChatSessions(
      userId,
      (sessions) => {
        console.log('🔄 Sessions updated from Firebase:', sessions.length);
        
        // Dispatch custom event for UI components
        this.dispatchSyncEvent('sessions-updated', {
          sessions,
          userId,
          deviceId: this.deviceId
        });
        
        // Update local cache
        // Note: StorageService will handle caching internally
      }
    );
    
    this.sessionListeners.set('sessions', sessionsUnsubscribe);
  }

  private static initializeActiveSessionSync(userId: string): void {
    const activeSessionId = StorageService.getActiveSessionId();
    if (activeSessionId) {
      console.log('🎯 Subscribing to active session messages:', activeSessionId);
      this.subscribeToSessionMessages(userId, activeSessionId);
    }
  }

  // ✅ SESSION MESSAGES SYNC
  static subscribeToSessionMessages(userId: string, sessionId: string): void {
    try {
      // Unsubscribe from previous session messages
      const prevUnsubscribe = this.messageListeners.get('messages');
      if (prevUnsubscribe) {
        console.log('🔌 Unsubscribing from previous session messages');
        prevUnsubscribe();
      }
      
      // Subscribe to new session messages
      const messagesUnsubscribe = FirebaseService.subscribeToSessionMessages(
        userId,
        sessionId,
        (messages) => {
          console.log(`📨 Messages updated for session ${sessionId}:`, messages.length);
          
          // Dispatch event for UI updates
          this.dispatchSyncEvent('messages-updated', {
            sessionId,
            messages,
            userId,
            deviceId: this.deviceId
          });
          
          // Check for conflicts if needed
          this.detectAndResolveConflicts(messages, sessionId);
        }
      );
      
      this.messageListeners.set('messages', messagesUnsubscribe);
      
      // Notify about session change
      this.dispatchSyncEvent('session-changed', {
        sessionId,
        userId,
        deviceId: this.deviceId
      });
      
    } catch (error) {
      console.error('❌ Error subscribing to session messages:', error);
    }
  }

  // ✅ CONFLICT DETECTION & RESOLUTION
  private static detectAndResolveConflicts(
    messages: any[], // Using any[] to handle Message/ChatMessage compatibility
    sessionId: string
  ): void {
    // Simple conflict detection: check for messages with very close timestamps
    const sortedMessages = messages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 0; i < sortedMessages.length - 1; i++) {
      const currentMsg = sortedMessages[i];
      const nextMsg = sortedMessages[i + 1];
      
      const timeDiff = new Date(nextMsg.timestamp).getTime() - new Date(currentMsg.timestamp).getTime();
      
      // If messages are within 2 seconds and from different senders, might be conflict
      if (timeDiff < 2000 && currentMsg.sender !== nextMsg.sender) {
        console.log('⚠️ Potential conflict detected between messages');
        
        this.dispatchSyncEvent('conflict-detected', {
          sessionId,
          conflictingMessages: [currentMsg, nextMsg],
          deviceId: this.deviceId
        });
      }
    }
  }

  static async handleConflictResolution(
    localMessage: ChatMessage,
    remoteMessage: ChatMessage,
    strategy: ConflictResolution['strategy'] = 'timestamp'
  ): Promise<ConflictResolution> {
    try {
      let winner: ChatMessage;
      let loser: ChatMessage;
      
      switch (strategy) {
        case 'timestamp':
          // Use timestamp to determine winner (latest wins)
          if (new Date(localMessage.timestamp) > new Date(remoteMessage.timestamp)) {
            winner = localMessage;
            loser = remoteMessage;
          } else {
            winner = remoteMessage;
            loser = localMessage;
          }
          break;
          
        case 'latest_wins':
          // Always prefer the most recent message
          winner = new Date(localMessage.timestamp) > new Date(remoteMessage.timestamp) 
            ? localMessage 
            : remoteMessage;
          loser = winner === localMessage ? remoteMessage : localMessage;
          break;
          
        case 'merge':
          // Merge content (basic implementation)
          winner = {
            ...localMessage,
            content: `${localMessage.content}\n---\n${remoteMessage.content}`,
            timestamp: new Date() // New timestamp for merged message
          };
          loser = remoteMessage;
          break;
          
        case 'user_decision':
          // This would typically show UI for user to decide
          // For now, default to timestamp strategy
          return this.handleConflictResolution(localMessage, remoteMessage, 'timestamp');
          
        default:
          winner = localMessage;
          loser = remoteMessage;
      }
      
      const resolution: ConflictResolution = {
        strategy,
        winner,
        loser,
        resolved: winner
      };
      
      console.log('✅ Conflict resolved using strategy:', strategy);
      return resolution;
      
    } catch (error) {
      console.error('❌ Error resolving conflict:', error);
      
      // Fallback: use timestamp strategy
      return this.handleConflictResolution(localMessage, remoteMessage, 'timestamp');
    }
  }

  // ✅ EVENT MANAGEMENT
  private static dispatchSyncEvent(type: SyncEvent['type'], data: any): void {
    const event: SyncEvent = {
      type,
      data,
      timestamp: new Date(),
      deviceId: this.deviceId
    };
    
    // Dispatch to window for global listening
    window.dispatchEvent(new CustomEvent(`sync-${type}`, { 
      detail: event 
    }));
    
    // Also dispatch generic sync event
    window.dispatchEvent(new CustomEvent('sync-event', { 
      detail: event 
    }));
  }

  // ✅ SESSION MANAGEMENT
  static async switchToSession(sessionId: string): Promise<void> {
    try {
      const userId = this.currentUserId || AuthService.getCurrentUser()?.id;
      if (!userId) {
        throw new Error('No authenticated user');
      }

      console.log('🔄 Switching to session:', sessionId);
      
      // Update StorageService active session
      await StorageService.setActiveSession(sessionId);
      
      // Subscribe to new session messages
      this.subscribeToSessionMessages(userId, sessionId);
      
      console.log('✅ Successfully switched to session:', sessionId);
      
    } catch (error) {
      console.error('❌ Error switching session:', error);
      throw error;
    }
  }

  // ✅ UTILITY METHODS
  private static generateDeviceId(): string {
    // Generate or retrieve device ID from localStorage
    let deviceId = localStorage.getItem('taskflow-device-id');
    
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('taskflow-device-id', deviceId);
    }
    
    return deviceId;
  }

  static cleanup(): void {
    console.log('🧹 Cleaning up real-time sync...');
    
    // Unsubscribe from all listeners
    this.sessionListeners.forEach((unsubscribe, key) => {
      console.log(`🔌 Unsubscribing from ${key}`);
      unsubscribe();
    });
    
    this.messageListeners.forEach((unsubscribe, key) => {
      console.log(`🔌 Unsubscribing from ${key}`);
      unsubscribe();
    });
    
    // Clear all listeners
    this.sessionListeners.clear();
    this.messageListeners.clear();
    
    // Reset state
    this.isInitialized = false;
    this.currentUserId = null;
    
    console.log('✅ Sync cleanup completed');
  }

  // ✅ STATUS & DEBUGGING
  static getStatus(): {
    isInitialized: boolean;
    userId: string | null;
    deviceId: string;
    activeListeners: string[];
  } {
    return {
      isInitialized: this.isInitialized,
      userId: this.currentUserId,
      deviceId: this.deviceId,
      activeListeners: [
        ...Array.from(this.sessionListeners.keys()),
        ...Array.from(this.messageListeners.keys())
      ]
    };
  }

  static forceResync(): void {
    console.log('🔄 Forcing resync...');
    
    if (this.currentUserId) {
      this.cleanup();
      this.initializeSync(this.currentUserId);
    } else {
      console.warn('⚠️ Cannot force resync: No current user');
    }
  }

  // ✅ EVENT LISTENER HELPERS (for UI components)
  static addEventListener(
    type: SyncEvent['type'], 
    callback: (event: CustomEvent<SyncEvent>) => void
  ): () => void {
    const eventName = `sync-${type}`;
    window.addEventListener(eventName, callback as EventListener);
    
    // Return cleanup function
    return () => {
      window.removeEventListener(eventName, callback as EventListener);
    };
  }

  static addGenericSyncListener(
    callback: (event: CustomEvent<SyncEvent>) => void
  ): () => void {
    window.addEventListener('sync-event', callback as EventListener);
    
    return () => {
      window.removeEventListener('sync-event', callback as EventListener);
    };
  }
}
