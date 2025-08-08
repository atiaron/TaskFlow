/* cspell:disable */
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
  increment,
  limitToLast
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task, ChatSession, ChatMessage } from '../types/index';
import { PerformanceMonitor } from './PerformanceMonitor';
import SecurityService from './SecurityService';

export class FirebaseService {
  
  // 🔗 CONNECTION TESTING
  
  /**
   * בדיקת חיבור ל-Firestore
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Firestore connection...');
      
      // ניסיון לקריאה פשוטה מFirestore
      const testCollection = collection(db, 'test');
      const testQuery = query(testCollection, limitToLast(1));
      
      // ביצוע הקריאה (לא משנה אם יש נתונים או לא)
      await getDocs(testQuery);
      
      console.log('✅ Firestore connection successful');
      return true;
    } catch (error: any) {
      console.error('❌ Firestore connection failed:', error);
      
      // בדיקה אם זו שגיאה של emulator
      if (error.message?.includes('fetch') || error.message?.includes('CORS')) {
        console.error('🚨 This might be a CORS/CSP issue with Firebase Emulator');
        console.log('💡 Try running: firebase emulators:start --only firestore');
      }
      
      return false;
    }
  }

  /**
   * אתחול ובדיקת מערכת Firebase
   */
  static async initialize(): Promise<boolean> {
    console.log('🔥 Initializing Firebase Service...');
    
    // בדיקת חיבור
    const isConnected = await this.testConnection();
    
    if (!isConnected) {
      console.warn('⚠️ Firebase connection failed - some features may not work');
    }
    
    return isConnected;
  }
  
  // 🎯 TASKS OPERATIONS
  
  static async addTask(userId: string, task: Omit<Task, 'id'>): Promise<string> {
    try {
      console.log('🔥 Adding task to Firestore:', task);
      
      // 🔒 Security validation
      if (!SecurityService.checkRateLimit(`task_creation_${userId}`, { windowMs: 60000, maxRequests: 10, blockDurationMs: 300000 })) {
        throw new Error('Rate limit exceeded for task creation');
      }
      
      const validation = SecurityService.validateTask({ ...task, userId });
      if (!validation.isValid) {
        throw new Error(`Task validation failed: ${validation.errors.join(', ')}`);
      }
      
      const sanitizedTask = validation.sanitizedData!;
      
      const taskData = {
        ...sanitizedTask,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      console.log('✅ Task added with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding task:', error);
      throw error;
    }
  }

  static async updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      // 🔒 Security validation
      if (!SecurityService.checkRateLimit(`task_update_${userId}`, { windowMs: 60000, maxRequests: 20, blockDurationMs: 300000 })) {
        throw new Error('Rate limit exceeded for task updates');
      }
      
      const validation = SecurityService.validateTask({ ...updates, userId } as Task);
      if (!validation.isValid) {
        throw new Error(`Task validation failed: ${validation.errors.join(', ')}`);
      }
      
      const sanitizedUpdates = validation.sanitizedData!;
      const taskRef = doc(db, 'tasks', taskId);
      
      await updateDoc(taskRef, {
        ...sanitizedUpdates,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Task updated:', taskId);
    } catch (error) {
      console.error('❌ Error updating task:', error);
      throw error;
    }
  }

  static async deleteTask(userId: string, taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      console.log('✅ Task deleted:', taskId);
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      throw error;
    }
  }

  static async getTasks(userId: string): Promise<Task[]> {
    try {
      console.log('🔥 Getting tasks from Firestore for user:', userId);
      
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          user_id: data.userId || data.user_id,
          title: data.title,
          description: data.description,
          completed: data.completed,
          priority: data.priority,
          category: data.category,
          dueDate: data.dueDate?.toDate?.() || data.dueDate,
          due_date: data.dueDate?.toDate?.() || data.dueDate,
          reminder_time: data.reminder_time?.toDate?.(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          created_at: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          updated_at: data.updatedAt?.toDate?.() || new Date(),
          created_by: data.created_by || 'manual',
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

      console.log('✅ Got tasks:', tasks.length);
      return tasks;
    } catch (error) {
      console.error('❌ Error getting tasks:', error);
      throw error;
    }
  }

  static async getTask(taskId: string, userId: string): Promise<Task | null> {
    try {
      console.log('🔥 Getting single task from Firestore:', taskId);
      
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      let foundTask: Task | null = null;
      
      querySnapshot.forEach((doc) => {
        if (doc.id === taskId) {
          const data = doc.data();
          foundTask = {
            id: doc.id,
            user_id: data.userId || data.user_id,
            title: data.title,
            description: data.description,
            completed: data.completed,
            priority: data.priority,
            category: data.category,
            dueDate: data.dueDate?.toDate?.() || data.dueDate,
            due_date: data.dueDate?.toDate?.() || data.dueDate,
            reminder_time: data.reminder_time?.toDate?.(),
            createdAt: data.createdAt?.toDate?.() || new Date(),
            created_at: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            updated_at: data.updatedAt?.toDate?.() || new Date(),
            created_by: data.created_by || 'manual',
            estimated_duration: data.estimated_duration,
            actual_duration: data.actual_duration,
            tags: data.tags || [],
            parent_id: data.parent_id,
            version: data.version || 1,
            last_modified_by: data.last_modified_by || 'unknown',
            sync_status: data.sync_status || 'synced',
            shared_with: data.shared_with || [],
            permissions: data.permissions || {}
          };
        }
      });

      console.log('✅ Got task:', foundTask ? 'found' : 'not found');
      return foundTask;
    } catch (error) {
      console.error('❌ Error getting task:', error);
      throw error;
    }
  }

  // 🎯 REAL-TIME TASKS LISTENER
  static subscribeToUserTasks(
    userId: string, 
    callback: (tasks: Task[]) => void
  ): () => void {
    console.log('👂 Setting up real-time tasks listener for user:', userId);
    
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasks: Task[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          user_id: data.userId || data.user_id,
          title: data.title,
          description: data.description,
          completed: data.completed,
          priority: data.priority,
          category: data.category,
          dueDate: data.dueDate?.toDate?.() || data.dueDate,
          due_date: data.dueDate?.toDate?.() || data.dueDate,
          reminder_time: data.reminder_time?.toDate?.(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          created_at: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          updated_at: data.updatedAt?.toDate?.() || new Date(),
          created_by: data.created_by || 'manual',
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

      console.log('🔄 Tasks updated:', tasks.length);
      callback(tasks);
    }, (error) => {
      console.error('❌ Error in tasks listener:', error);
    });

    return unsubscribe;
  }

  // 🎯 CHAT SESSIONS OPERATIONS
  
  static async createChatSession(
    userId: string, 
    title: string = 'שיחה חדשה'
  ): Promise<string> {
    try {
      console.log('🔥 Creating chat session for user:', userId);
      
      // 🔒 Security validation
      if (!SecurityService.checkRateLimit(`session_creation_${userId}`, { windowMs: 60000, maxRequests: 5, blockDurationMs: 300000 })) {
        throw new Error('Rate limit exceeded for session creation');
      }
      
      const sessionData = {
        title: SecurityService.sanitizeInput(title),
        created_at: new Date(),
        updated_at: new Date(),
        status: 'active' as const,
        message_count: 0,
        context_summary: ''
      };
      
      const validation = SecurityService.validateChatSession(sessionData);
      if (!validation.isValid) {
        throw new Error(`Session validation failed: ${validation.errors.join(', ')}`);
      }
      
      const sessionRef = await addDoc(
        collection(db, `users/${userId}/chat_sessions`),
        {
          title: sessionData.title,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          status: 'active',
          message_count: 0,
          context_summary: ''
        }
      );
      
      console.log('✅ Chat session created:', sessionRef.id);
      return sessionRef.id;
    } catch (error) {
      console.error('❌ Error creating chat session:', error);
      throw new Error('Failed to create chat session');
    }
  }

  static async getChatSessions(userId: string): Promise<ChatSession[]> {
    try {
      console.log('🔥 Getting chat sessions for user:', userId);
      
      const sessionsQuery = query(
        collection(db, `users/${userId}/chat_sessions`),
        orderBy('updated_at', 'desc')
      );
      
      const snapshot = await getDocs(sessionsQuery);
      const sessions: ChatSession[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          user_id: userId,
          title: data.title || 'שיחה חדשה',
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
          status: data.status || 'active',
          message_count: data.message_count || 0,
          summary: data.context_summary || '',
          is_starred: data.is_starred || false,
          last_message: data.last_message || '',
          // Aliases for compatibility
          createdAt: data.created_at?.toDate() || new Date(),
          updatedAt: data.updated_at?.toDate() || new Date(),
          messageCount: data.message_count || 0,
          isStarred: data.is_starred || false,
          userId: userId
        } as ChatSession;
      });
      
      console.log('✅ Got chat sessions:', sessions.length);
      return sessions;
    } catch (error) {
      console.error('❌ Error fetching chat sessions:', error);
      return [];
    }
  }

  static async updateChatSession(
    userId: string,
    sessionId: string,
    updates: Partial<ChatSession>
  ): Promise<void> {
    try {
      const sessionRef = doc(db, `users/${userId}/chat_sessions/${sessionId}`);
      await updateDoc(sessionRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
      
      console.log('✅ Chat session updated:', sessionId);
    } catch (error) {
      console.error('❌ Error updating chat session:', error);
      throw new Error('Failed to update chat session');
    }
  }

  static async deleteChatSession(userId: string, sessionId: string): Promise<void> {
    try {
      console.log('🔥 Deleting chat session and messages:', sessionId);
      
      const batch = writeBatch(db);
      
      // Delete session
      const sessionRef = doc(db, `users/${userId}/chat_sessions/${sessionId}`);
      batch.delete(sessionRef);
      
      // Delete all messages in session
      const messagesQuery = query(
        collection(db, `users/${userId}/chat_messages`),
        where('session_id', '==', sessionId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log('✅ Chat session and messages deleted:', sessionId);
    } catch (error) {
      console.error('❌ Error deleting chat session:', error);
      throw new Error('Failed to delete chat session');
    }
  }

  // 🎯 REAL-TIME CHAT SESSIONS LISTENER
  static subscribeToChatSessions(
    userId: string,
    callback: (sessions: ChatSession[]) => void
  ): () => void {
    console.log('👂 Setting up real-time sessions listener for user:', userId);
    
    const sessionsQuery = query(
      collection(db, `users/${userId}/chat_sessions`),
      orderBy('updated_at', 'desc')
    );

    return onSnapshot(
      sessionsQuery,
      (snapshot) => {
        const sessions: ChatSession[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            user_id: userId,
            title: data.title || 'שיחה חדשה',
            created_at: data.created_at?.toDate() || new Date(),
            updated_at: data.updated_at?.toDate() || new Date(),
            status: data.status || 'active',
            message_count: data.message_count || 0,
            summary: data.context_summary || '',
            is_starred: data.is_starred || false,
            last_message: data.last_message || '',
            // Aliases for compatibility
            createdAt: data.created_at?.toDate() || new Date(),
            updatedAt: data.updated_at?.toDate() || new Date(),
            messageCount: data.message_count || 0,
            isStarred: data.is_starred || false,
            userId: userId
          } as ChatSession;
        });
        
        console.log('🔄 Sessions updated:', sessions.length);
        callback(sessions);
      },
      (error) => {
        console.error('❌ Error in sessions subscription:', error);
        callback([]);
      }
    );
  }

  // 🎯 ENHANCED CHAT MESSAGES OPERATIONS WITH SESSION LINKING
  
  static async saveChatMessage(
    userId: string,
    sessionId: string,
    message: Omit<ChatMessage, 'id'>
  ): Promise<string> {
    try {
      console.log('🔥 Saving message to session:', sessionId);
      
      // 🔒 Security validation
      if (!SecurityService.checkRateLimit(`message_creation_${userId}`, { windowMs: 60000, maxRequests: 50, blockDurationMs: 300000 })) {
        throw new Error('Rate limit exceeded for message creation');
      }
      
      const validation = SecurityService.validateChatMessage({ ...message, session_id: sessionId });
      if (!validation.isValid) {
        throw new Error(`Message validation failed: ${validation.errors.join(', ')}`);
      }
      
      const sanitizedMessage = validation.sanitizedData!;
      
      const batch = writeBatch(db);
      
      // Add message with session_id
      const messageRef = doc(collection(db, `users/${userId}/chat_messages`));
      batch.set(messageRef, {
        ...sanitizedMessage,
        session_id: sessionId,
        timestamp: serverTimestamp()
      });
      
      // Update session's message count and last activity
      const sessionRef = doc(db, `users/${userId}/chat_sessions/${sessionId}`);
      batch.update(sessionRef, {
        message_count: increment(1),
        updated_at: serverTimestamp()
      });
      
      await batch.commit();
      console.log('✅ Message saved with session link:', messageRef.id);
      return messageRef.id;
    } catch (error) {
      console.error('❌ Error saving chat message:', error);
      throw new Error('Failed to save chat message');
    }
  }

  static async getChatHistory(
    userId: string,
    sessionId: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    try {
      console.log('🔥 Getting chat history for session:', sessionId);
      
      const messagesQuery = query(
        collection(db, `users/${userId}/chat_messages`),
        where('session_id', '==', sessionId),
        orderBy('timestamp', 'asc'),
        limitToLast(limit)
      );
      
      const snapshot = await getDocs(messagesQuery);
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as ChatMessage));
      
      console.log('✅ Got chat history:', messages.length, 'messages');
      return messages;
    } catch (error) {
      console.error('❌ Error fetching chat history:', error);
      return [];
    }
  }

  static subscribeToSessionMessages(
    userId: string,
    sessionId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    console.log('👂 Setting up real-time messages listener for session:', sessionId);
    
    const messagesQuery = query(
      collection(db, `users/${userId}/chat_messages`),
      where('session_id', '==', sessionId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages: ChatMessage[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        } as ChatMessage));
        
        console.log('🔄 Messages updated for session:', sessionId, ':', messages.length, 'messages');
        callback(messages);
      },
      (error) => {
        console.error('❌ Error in messages subscription:', error);
        callback([]);
      }
    );
  }

  // 🎯 LEGACY CHAT OPERATIONS (DEPRECATED - השתמש בפונקציות החדשות למעלה)
  
  static async saveChatMessage_LEGACY(userId: string, message: ChatMessage): Promise<void> {
    console.warn('⚠️ Using deprecated saveChatMessage. Use saveChatMessage(userId, sessionId, message) instead');
    try {
      await addDoc(collection(db, 'chat_messages'), {
        ...message,
        userId,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error saving chat message:', error);
      throw error;
    }
  }

  static async getChatHistory_LEGACY(userId: string, limit = 20): Promise<ChatMessage[]> {
    console.warn('⚠️ Using deprecated getChatHistory. Use getChatHistory(userId, sessionId) instead');
    try {
      const q = query(
        collection(db, 'chat_messages'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        // limit(limit) // אפשר להוסיף limit אם רוצים
      );

      const querySnapshot = await getDocs(q);
      const messages: ChatMessage[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          chat_id: data.chat_id || '',
          content: data.content,
          sender: data.sender,
          timestamp: data.timestamp?.toDate?.() || new Date(),
          tokens_used: data.tokens_used,
          actions: data.actions,
          status: data.status || 'delivered',
          error_message: data.error_message
        });
      });

      return messages.reverse(); // החזר בסדר כרונולוגי
    } catch (error) {
      console.error('❌ Error getting chat history:', error);
      return [];
    }
  }

  // 🎯 USER PREFERENCES
  
  static async saveUserPreferences(userId: string, preferences: any): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        preferences,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error saving user preferences:', error);
      throw error;
    }
  }

  static async getUserPreferences(userId: string): Promise<any> {
    try {
      // יוחזר בהמשך כשנצטרך
      return {};
    } catch (error) {
      console.error('❌ Error getting user preferences:', error);
      return {};
    }
  }
}