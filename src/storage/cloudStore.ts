// Cloud Store - Firestore
import { Task } from '../types';
import { IStore } from './IStore';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

class CloudStore implements IStore {
  private currentUserId: string | null = null;

  setUserId(userId: string | null): void {
    this.currentUserId = userId;
    console.log(`🔧 Cloud Store: User ID set to ${userId}`);
  }

  private getUserCollection() {
    if (!this.currentUserId) {
      throw new Error('❌ Cloud Store: No user ID set');
    }
    return collection(db, 'users', this.currentUserId, 'tasks');
  }

  async list(): Promise<Task[]> {
    try {
      const q = query(this.getUserCollection(), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      console.log(`✅ Cloud Store: Retrieved ${tasks.length} tasks`);
      return tasks;
    } catch (error) {
      console.error('❌ Cloud Store: List failed:', error);
      return [];
    }
  }

  async get(id: string): Promise<Task | null> {
    try {
      const docRef = doc(this.getUserCollection(), id);
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        const task = { id: snapshot.id, ...snapshot.data() } as Task;
        console.log(`✅ Cloud Store: Retrieved task ${id}`);
        return task;
      }
      return null;
    } catch (error) {
      console.error(`❌ Cloud Store: Get ${id} failed:`, error);
      return null;
    }
  }

  async upsert(item: Task): Promise<Task> {
    try {
      const taskWithTimestamp = {
        ...item,
        updatedAt: new Date()
      };
      
      const docRef = doc(this.getUserCollection(), item.id);
      await setDoc(docRef, taskWithTimestamp);
      console.log(`✅ Cloud Store: Saved task ${item.id}`);
      return taskWithTimestamp;
    } catch (error) {
      console.error(`❌ Cloud Store: Upsert ${item.id} failed:`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const docRef = doc(this.getUserCollection(), id);
      await deleteDoc(docRef);
      console.log(`🗑️ Cloud Store: Removed task ${id}`);
    } catch (error) {
      console.error(`❌ Cloud Store: Remove ${id} failed:`, error);
      throw error;
    }
  }

  async bulkUpsert(items: Task[]): Promise<Task[]> {
    if (items.length === 0) return [];

    try {
      const batch = writeBatch(db);
      const results: Task[] = [];

      for (const item of items) {
        const taskWithTimestamp = {
          ...item,
          updatedAt: new Date()
        };
        
        const docRef = doc(this.getUserCollection(), item.id);
        batch.set(docRef, taskWithTimestamp);
        results.push(taskWithTimestamp);
      }

      await batch.commit();
      console.log(`✅ Cloud Store: Bulk upserted ${items.length} tasks`);
      return results;
    } catch (error) {
      console.error('❌ Cloud Store: Bulk upsert failed:', error);
      throw error;
    }
  }

  async bulkRemove(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    try {
      const batch = writeBatch(db);

      for (const id of ids) {
        const docRef = doc(this.getUserCollection(), id);
        batch.delete(docRef);
      }

      await batch.commit();
      console.log(`🗑️ Cloud Store: Bulk removed ${ids.length} tasks`);
    } catch (error) {
      console.error('❌ Cloud Store: Bulk remove failed:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const snapshot = await getDocs(this.getUserCollection());
      const batch = writeBatch(db);

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log('🧹 Cloud Store: All tasks cleared');
    } catch (error) {
      console.error('❌ Cloud Store: Clear failed:', error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const snapshot = await getDocs(this.getUserCollection());
      return snapshot.size;
    } catch (error) {
      console.error('❌ Cloud Store: Count failed:', error);
      return 0;
    }
  }
}

const cloudStoreInstance = new CloudStore();
export default cloudStoreInstance;
