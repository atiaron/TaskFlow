import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { Task } from '../types';

class FirebaseService {
  private tasksCollection = 'tasks';

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const taskData = {
        ...task,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : null
      };

      const docRef = await addDoc(collection(db, this.tasksCollection), taskData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      const taskRef = doc(db, this.tasksCollection, taskId);
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (updates.dueDate) {
        updateData.dueDate = Timestamp.fromDate(updates.dueDate);
      }

      await updateDoc(taskRef, updateData);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      const taskRef = doc(db, this.tasksCollection, taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, this.tasksCollection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return this.mapQuerySnapshotToTasks(querySnapshot);
    } catch (error) {
      console.error('Error getting user tasks:', error);
      throw error;
    }
  }

  subscribeToUserTasks(userId: string, callback: (tasks: Task[]) => void): () => void {
    const q = query(
      collection(db, this.tasksCollection),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const tasks = this.mapQuerySnapshotToTasks(querySnapshot);
      callback(tasks);
    }, (error) => {
      console.error('Error in tasks subscription:', error);
    });
  }

  async toggleTaskComplete(taskId: string, completed: boolean): Promise<void> {
    await this.updateTask(taskId, { completed });
  }

  private mapQuerySnapshotToTasks(querySnapshot: QuerySnapshot<DocumentData>): Task[] {
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description || '',
        completed: data.completed,
        priority: data.priority,
        dueDate: data.dueDate ? data.dueDate.toDate() : undefined,
        tags: data.tags || [],
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        userId: data.userId
      } as Task;
    });
  }
}

export const firebaseService = new FirebaseService();