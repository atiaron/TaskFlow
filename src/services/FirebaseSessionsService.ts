/**
 * TaskFlow - Firebase Sessions Service
 * Sub-Collections Implementation
 * תאריך יצירה: 6 באוגוסט 2025
 * 
 * Schema:
 * /users/{userId}/chat_sessions/{sessionId}
 * /users/{userId}/chat_messages/{messageId}
 */

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
  serverTimestamp,
  writeBatch,
  increment,
  limitToLast
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  ChatSession,
  ChatMessage,
  ChatSessionData,
  ChatMessageData,
  CreateSessionRequest,
  CreateMessageRequest,
  UpdateSessionRequest,
  SessionsQuery,
  MessagesQuery,
  SessionsCallback,
  MessagesCallback,
  SubscriptionManager
} from '../types/sessions';

export class FirebaseSessionsService {
  private static subscriptions: SubscriptionManager = {
    sessions: () => {},
    messages: new Map()
  };

  // ========================
  // 🗨️ CHAT SESSIONS CRUD
  // ========================

  /**
   * יצירת session חדש
   * Path: /users/{userId}/chat_sessions/{sessionId}
   */
  static async createChatSession(
    userId: string, 
    request: CreateSessionRequest = {}
  ): Promise<string> {
    try {
      console.log('🔥 Creating chat session for user:', userId);
      
      const sessionData: Omit<ChatSessionData, 'created_at' | 'updated_at'> = {
        title: request.title || 'שיחה חדשה',
        status: 'active',
        message_count: 0,
        context_summary: request.context_summary || ''
      };
      
      const sessionRef = await addDoc(
        collection(db, `users/${userId}/chat_sessions`),
        {
          ...sessionData,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        }
      );
      
      console.log('✅ Chat session created:', sessionRef.id);
      return sessionRef.id;
    } catch (error) {
      console.error('❌ Error creating chat session:', error);
      throw new Error(`Failed to create chat session: ${error}`);
    }
  }

  /**
   * שליפת כל הsessions של user
   * Path: /users/{userId}/chat_sessions/
   */
  static async getChatSessions(
    userId: string, 
    queryOptions: SessionsQuery = {}
  ): Promise<ChatSession[]> {
    try {
      console.log('🔥 Getting chat sessions for user:', userId);
      
      let sessionsQuery = query(
        collection(db, `users/${userId}/chat_sessions`)
      );
      
      // Add filters
      if (queryOptions.status) {
        sessionsQuery = query(sessionsQuery, where('status', '==', queryOptions.status));
      }
      
      // Add ordering
      const orderByField = queryOptions.orderBy || 'updated_at';
      const orderDirection = queryOptions.orderDirection || 'desc';
      sessionsQuery = query(sessionsQuery, orderBy(orderByField, orderDirection));
      
      // Add limit
      if (queryOptions.limit) {
        sessionsQuery = query(sessionsQuery, limitToLast(queryOptions.limit));
      }
      
      const snapshot = await getDocs(sessionsQuery);
      const sessions: ChatSession[] = snapshot.docs.map(doc => 
        this.transformSessionDocument(doc.id, userId, doc.data())
      );
      
      console.log('✅ Got chat sessions:', sessions.length);
      return sessions;
    } catch (error) {
      console.error('❌ Error fetching chat sessions:', error);
      return [];
    }
  }

  /**
   * עדכון session קיים
   */
  static async updateChatSession(
    userId: string,
    sessionId: string,
    updates: UpdateSessionRequest
  ): Promise<void> {
    try {
      console.log('🔥 Updating chat session:', sessionId);
      
      const sessionRef = doc(db, `users/${userId}/chat_sessions/${sessionId}`);
      await updateDoc(sessionRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
      
      console.log('✅ Chat session updated:', sessionId);
    } catch (error) {
      console.error('❌ Error updating chat session:', error);
      throw new Error(`Failed to update chat session: ${error}`);
    }
  }

  /**
   * מחיקת session וכל ההודעות שלו
   */
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
      throw new Error(`Failed to delete chat session: ${error}`);
    }
  }

  // ========================
  // 📨 CHAT MESSAGES CRUD
  // ========================

  /**
   * שמירת הודעה חדשה
   * Path: /users/{userId}/chat_messages/{messageId}
   */
  static async saveChatMessage(
    userId: string,
    request: CreateMessageRequest
  ): Promise<string> {
    try {
      console.log('🔥 Saving message to session:', request.session_id);
      
      const batch = writeBatch(db);
      
      // Add message
      const messageRef = doc(collection(db, `users/${userId}/chat_messages`));
      const messageData: ChatMessageData = {
        session_id: request.session_id,
        content: request.content,
        role: request.role,
        type: request.type || 'text',
        timestamp: new Date(), // Will be overwritten by serverTimestamp
        metadata: request.metadata
      };
      
      batch.set(messageRef, {
        ...messageData,
        timestamp: serverTimestamp()
      });
      
      // Update session's message count and last activity
      const sessionRef = doc(db, `users/${userId}/chat_sessions/${request.session_id}`);
      batch.update(sessionRef, {
        message_count: increment(1),
        updated_at: serverTimestamp()
      });
      
      await batch.commit();
      console.log('✅ Message saved with session link:', messageRef.id);
      return messageRef.id;
    } catch (error) {
      console.error('❌ Error saving chat message:', error);
      throw new Error(`Failed to save chat message: ${error}`);
    }
  }

  /**
   * שליפת היסטוריית הודעות לsession
   */
  static async getChatHistory(
    userId: string,
    sessionId: string,
    queryOptions: MessagesQuery = {}
  ): Promise<ChatMessage[]> {
    try {
      console.log('🔥 Getting chat history for session:', sessionId);
      
      let messagesQuery = query(
        collection(db, `users/${userId}/chat_messages`),
        where('session_id', '==', sessionId)
      );
      
      // Add ordering
      const orderByField = queryOptions.orderBy || 'timestamp';
      const orderDirection = queryOptions.orderDirection || 'asc';
      messagesQuery = query(messagesQuery, orderBy(orderByField, orderDirection));
      
      // Add limit
      if (queryOptions.limit) {
        messagesQuery = query(messagesQuery, limitToLast(queryOptions.limit));
      }
      
      const snapshot = await getDocs(messagesQuery);
      const messages: ChatMessage[] = snapshot.docs.map(doc =>
        this.transformMessageDocument(doc.id, userId, doc.data())
      );
      
      console.log('✅ Got chat history:', messages.length, 'messages');
      return messages;
    } catch (error) {
      console.error('❌ Error fetching chat history:', error);
      return [];
    }
  }

  // ========================
  // 👂 REAL-TIME SUBSCRIPTIONS
  // ========================

  /**
   * האזנה לשינויים בsessions
   */
  static subscribeToChatSessions(
    userId: string,
    callback: SessionsCallback,
    queryOptions: SessionsQuery = {}
  ): () => void {
    console.log('👂 Setting up real-time sessions listener for user:', userId);
    
    let sessionsQuery = query(
      collection(db, `users/${userId}/chat_sessions`)
    );
    
    // Add filters and ordering
    if (queryOptions.status) {
      sessionsQuery = query(sessionsQuery, where('status', '==', queryOptions.status));
    }
    
    const orderByField = queryOptions.orderBy || 'updated_at';
    const orderDirection = queryOptions.orderDirection || 'desc';
    sessionsQuery = query(sessionsQuery, orderBy(orderByField, orderDirection));

    const unsubscribe = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        const sessions: ChatSession[] = snapshot.docs.map(doc =>
          this.transformSessionDocument(doc.id, userId, doc.data())
        );
        
        console.log('🔄 Sessions updated:', sessions.length);
        callback(sessions);
      },
      (error) => {
        console.error('❌ Error in sessions subscription:', error);
        callback([]);
      }
    );

    // Store subscription for cleanup
    this.subscriptions.sessions = unsubscribe;
    return unsubscribe;
  }

  /**
   * האזנה להודעות של session ספציפי
   */
  static subscribeToSessionMessages(
    userId: string,
    sessionId: string,
    callback: MessagesCallback,
    queryOptions: MessagesQuery = {}
  ): () => void {
    console.log('👂 Setting up real-time messages listener for session:', sessionId);
    
    let messagesQuery = query(
      collection(db, `users/${userId}/chat_messages`),
      where('session_id', '==', sessionId)
    );
    
    const orderByField = queryOptions.orderBy || 'timestamp';
    const orderDirection = queryOptions.orderDirection || 'asc';
    messagesQuery = query(messagesQuery, orderBy(orderByField, orderDirection));

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages: ChatMessage[] = snapshot.docs.map(doc =>
          this.transformMessageDocument(doc.id, userId, doc.data())
        );
        
        console.log('🔄 Messages updated for session:', sessionId, ':', messages.length, 'messages');
        callback(messages);
      },
      (error) => {
        console.error('❌ Error in messages subscription:', error);
        callback([]);
      }
    );

    // Store subscription for cleanup
    this.subscriptions.messages.set(sessionId, unsubscribe);
    return unsubscribe;
  }

  // ========================
  // 🧹 CLEANUP & UTILITIES
  // ========================

  /**
   * ניקוי כל הsubscriptions
   */
  static cleanup(): void {
    console.log('🧹 Cleaning up Firebase subscriptions');
    
    // Unsubscribe from sessions
    this.subscriptions.sessions();
    
    // Unsubscribe from all message listeners
    this.subscriptions.messages.forEach(unsubscribe => unsubscribe());
    this.subscriptions.messages.clear();
  }

  /**
   * המרת document של session לטיפוס ChatSession
   */
  private static transformSessionDocument(
    sessionId: string, 
    userId: string, 
    data: any
  ): ChatSession {
    return {
      id: sessionId,
      user_id: userId,
      title: data.title || 'שיחה חדשה',
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
      status: data.status || 'active',
      message_count: data.message_count || 0,
      context_summary: data.context_summary || '',
      // Aliases
      createdAt: data.created_at?.toDate() || new Date(),
      updatedAt: data.updated_at?.toDate() || new Date(),
      messageCount: data.message_count || 0,
      userId: userId,
      isStarred: data.is_starred || false
    };
  }

  /**
   * המרת document של message לטיפוס ChatMessage
   */
  private static transformMessageDocument(
    messageId: string,
    userId: string,
    data: any
  ): ChatMessage {
    return {
      id: messageId,
      user_id: userId,
      session_id: data.session_id,
      content: data.content,
      role: data.role,
      timestamp: data.timestamp?.toDate() || new Date(),
      type: data.type || 'text',
      metadata: data.metadata,
      // Aliases
      sender: data.role === 'assistant' ? 'ai' : 'user'
    };
  }
}
