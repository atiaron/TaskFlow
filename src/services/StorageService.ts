import { FirebaseService } from './FirebaseService';
// Import AuthService directly to avoid circular dependency
import MockAuth from './MockAuth';
import RealAuth from './RealAuth';
import { Task, ChatMessage, ChatSession } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Determine which auth service to use
const isDev = process.env.NODE_ENV === 'development' || 
             process.env.REACT_APP_IS_DEV_MODE === 'true' ||
             (typeof window !== 'undefined' && window.location.hostname === 'localhost');

const AuthService = isDev ? MockAuth : RealAuth;

/**
 * StorageService - Enhanced wrapper around FirebaseService
 * Now includes full session management with active session tracking
 */
export class StorageService {
  private static activeSessionId: string | null = null;
  private static cachedSessions: ChatSession[] = [];

  // ✅ TASK OPERATIONS (Existing - unchanged)
  static async addTask(task: Omit<Task, 'id'>, userId?: string): Promise<string> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return FirebaseService.addTask(userId, task);
  }

  static async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    if (!task.userId) {
      throw new Error('User ID is required in task');
    }
    
    const taskId = await FirebaseService.addTask(task.userId, task);
    const createdTask = await FirebaseService.getTask(taskId, task.userId);
    
    if (!createdTask) {
      throw new Error('Failed to retrieve created task');
    }
    
    return createdTask;
  }

  static async getAllTasks(userId?: string): Promise<Task[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return FirebaseService.getTasks(userId);
  }

  static async getTask(taskId: string, userId?: string): Promise<Task | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return FirebaseService.getTask(taskId, userId);
  }

  static async updateTask(taskId: string, updates: Partial<Task>, userId?: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return FirebaseService.updateTask(userId, taskId, updates);
  }

  static async updateTaskById(taskId: string, updates: Partial<Task>): Promise<Task> {
    if (!updates.userId) {
      throw new Error('User ID is required in updates');
    }
    
    await FirebaseService.updateTask(updates.userId, taskId, updates);
    const updatedTask = await FirebaseService.getTask(taskId, updates.userId);
    
    if (!updatedTask) {
      throw new Error('Failed to retrieve updated task');
    }
    
    return updatedTask;
  }

  static async deleteTask(taskId: string, userId?: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return FirebaseService.deleteTask(userId, taskId);
  }

  // ✅ SESSION MANAGEMENT (NEW - Fully Implemented)
  static async getActiveChatSession(): Promise<ChatSession | null> {
    try {
      if (!this.activeSessionId) {
        const sessions = await this.getChatSessions();
        if (sessions.length > 0) {
          this.activeSessionId = sessions[0].id;
          return sessions[0];
        }
        return null;
      }
      
      const user = AuthService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      
      const sessionRef = doc(db, `users/${user.id}/chat_sessions/${this.activeSessionId}`);
      const sessionDoc = await getDoc(sessionRef);
      
      if (sessionDoc.exists()) {
        return {
          id: sessionDoc.id,
          user_id: user.id,
          ...sessionDoc.data(),
          created_at: sessionDoc.data().created_at?.toDate() || new Date(),
          updated_at: sessionDoc.data().updated_at?.toDate() || new Date()
        } as ChatSession;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting active chat session:', error);
      return null;
    }
  }

  static async addChatSession(session: Omit<ChatSession, 'id'>): Promise<string> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      
      const sessionId = await FirebaseService.createChatSession(
        user.id,
        session.title
      );
      
      // Set as active session
      this.activeSessionId = sessionId;
      
      // Refresh cached sessions
      await this.refreshSessions();
      
      return sessionId;
    } catch (error) {
      console.error('❌ Error adding chat session:', error);
      throw error;
    }
  }

  static async getChatSessions(): Promise<ChatSession[]> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) return [];
      
      this.cachedSessions = await FirebaseService.getChatSessions(user.id);
      return this.cachedSessions;
    } catch (error) {
      console.error('❌ Error getting chat sessions:', error);
      return [];
    }
  }

  static async updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<void> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      
      await FirebaseService.updateChatSession(user.id, sessionId, updates);
      
      // Refresh cached sessions if needed
      if (this.cachedSessions.length > 0) {
        await this.refreshSessions();
      }
    } catch (error) {
      console.error('❌ Error updating chat session:', error);
      throw error;
    }
  }

  static async setActiveSession(sessionId: string): Promise<void> {
    this.activeSessionId = sessionId;
    
    // Update session's last accessed time
    try {
      const user = AuthService.getCurrentUser();
      if (user) {
        await FirebaseService.updateChatSession(user.id, sessionId, {
          updated_at: new Date()
        });
      }
    } catch (error) {
      console.error('❌ Error updating session access time:', error);
    }
  }

  static getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  // ✅ MESSAGE OPERATIONS (NEW - With Session Linking)
  static async saveChatMessage(userId: string, message: ChatMessage): Promise<void>;
  static async saveChatMessage(message: Omit<ChatMessage, 'id'>): Promise<void>;
  static async saveChatMessage(
    userIdOrMessage: string | Omit<ChatMessage, 'id'>, 
    message?: ChatMessage
  ): Promise<void> {
    try {
      // Handle overloaded signatures
      if (typeof userIdOrMessage === 'string' && message) {
        // Legacy signature: saveChatMessage(userId, message)
        const userId = userIdOrMessage;
        const sessionId = this.activeSessionId;
        if (!sessionId) throw new Error('No active session');
        
        await FirebaseService.saveChatMessage(userId, sessionId, message);
      } else if (typeof userIdOrMessage === 'object') {
        // New signature: saveChatMessage(message)
        const user = AuthService.getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        
        const sessionId = this.activeSessionId;
        if (!sessionId) throw new Error('No active session');
        
        await FirebaseService.saveChatMessage(user.id, sessionId, userIdOrMessage);
      } else {
        throw new Error('Invalid arguments');
      }
    } catch (error) {
      console.error('❌ Error saving chat message:', error);
      throw error;
    }
  }

  static async getChatHistory(userId?: string, sessionId?: string): Promise<ChatMessage[]> {
    try {
      const user = AuthService.getCurrentUser();
      const targetUserId = userId || user?.id;
      if (!targetUserId) return [];
      
      const targetSessionId = sessionId || this.activeSessionId;
      if (!targetSessionId) return [];
      
      return await FirebaseService.getChatHistory(targetUserId, targetSessionId);
    } catch (error) {
      console.error('❌ Error getting chat history:', error);
      return [];
    }
  }

  // ✅ REAL-TIME SUBSCRIPTIONS (NEW)
  static subscribeToSessions(callback: (sessions: ChatSession[]) => void): () => void {
    const user = AuthService.getCurrentUser();
    if (!user) {
      callback([]);
      return () => {};
    }
    
    return FirebaseService.subscribeToChatSessions(user.id, (sessions) => {
      this.cachedSessions = sessions;
      callback(sessions);
    });
  }

  static subscribeToActiveSessionMessages(callback: (messages: ChatMessage[]) => void): () => void {
    const user = AuthService.getCurrentUser();
    if (!user || !this.activeSessionId) {
      callback([]);
      return () => {};
    }
    
    return FirebaseService.subscribeToSessionMessages(
      user.id,
      this.activeSessionId,
      callback
    );
  }

  // ✅ UTILITY METHODS (NEW)
  private static async refreshSessions(): Promise<void> {
    try {
      const user = AuthService.getCurrentUser();
      if (user) {
        this.cachedSessions = await FirebaseService.getChatSessions(user.id);
      }
    } catch (error) {
      console.error('❌ Error refreshing sessions:', error);
    }
  }

  static clearCache(): void {
    this.activeSessionId = null;
    this.cachedSessions = [];
  }
}
