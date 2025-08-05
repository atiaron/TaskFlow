import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task, ChatSession, ChatMessage } from '../types';

export class FirebaseService {
  
  // 🎯 TASKS OPERATIONS
  
  static async addTask(userId: string, task: Omit<Task, 'id'>): Promise<string> {
    try {
      console.log('🔥 Adding task to Firestore:', task);
      
      const taskData = {
        ...task,
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
      const taskRef = doc(db, 'tasks', taskId);
      
      await updateDoc(taskRef, {
        ...updates,
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
          title: data.title,
          description: data.description,
          completed: data.completed,
          priority: data.priority,
          dueDate: data.dueDate?.toDate?.() || data.dueDate,
          tags: data.tags || [],
          estimatedTime: data.estimatedTime,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        });
      });

      console.log('🔄 Tasks updated:', tasks.length);
      callback(tasks);
    }, (error) => {
      console.error('❌ Error in tasks listener:', error);
    });

    return unsubscribe;
  }

  // 🎯 CHAT OPERATIONS
  
  static async saveChatMessage(userId: string, message: ChatMessage): Promise<void> {
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

  static async getChatHistory(userId: string, limit = 20): Promise<ChatMessage[]> {
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
          content: data.content,
          sender: data.sender,
          timestamp: data.timestamp?.toDate?.() || new Date(),
          type: data.type || 'text'
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