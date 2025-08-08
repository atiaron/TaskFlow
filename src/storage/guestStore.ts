// Guest Store - IndexedDB עם Fallback ל-localStorage
import { Task } from '../types';
import { IStore } from './IStore';

class GuestStore implements IStore {
  private readonly STORE_NAME = 'tf_guest_tasks_v1';
  private readonly DB_NAME = 'TaskFlowGuest';
  private readonly VERSION = 1;
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt');
          store.createIndex('completed', 'completed');
        }
      };
    });
  }

  private async withTransaction<T>(
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    const db = await this.getDB();
    const transaction = db.transaction([this.STORE_NAME], mode);
    const store = transaction.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = callback(store);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async list(): Promise<Task[]> {
    try {
      return await this.withTransaction('readonly', (store) => store.getAll());
    } catch (error) {
      console.warn('🔧 Guest Store: IndexedDB failed, using localStorage fallback');
      return this.listFromLocalStorage();
    }
  }

  async get(id: string): Promise<Task | null> {
    try {
      const result = await this.withTransaction('readonly', (store) => store.get(id));
      return result || null;
    } catch (error) {
      console.warn('🔧 Guest Store: IndexedDB failed, using localStorage fallback');
      return this.getFromLocalStorage(id);
    }
  }

  async upsert(item: Task): Promise<Task> {
    const taskWithTimestamp = {
      ...item,
      updatedAt: new Date()
    };

    try {
      await this.withTransaction('readwrite', (store) => store.put(taskWithTimestamp));
      console.log(`✅ Guest Store: Saved task ${item.id}`);
      return taskWithTimestamp;
    } catch (error) {
      console.warn('🔧 Guest Store: IndexedDB failed, using localStorage fallback');
      return this.upsertToLocalStorage(taskWithTimestamp);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.withTransaction('readwrite', (store) => store.delete(id));
      console.log(`🗑️ Guest Store: Removed task ${id}`);
    } catch (error) {
      console.warn('🔧 Guest Store: IndexedDB failed, using localStorage fallback');
      this.removeFromLocalStorage(id);
    }
  }

  async bulkUpsert(items: Task[]): Promise<Task[]> {
    const results: Task[] = [];
    for (const item of items) {
      results.push(await this.upsert(item));
    }
    return results;
  }

  async bulkRemove(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.remove(id);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.withTransaction('readwrite', (store) => store.clear());
      console.log('🧹 Guest Store: All tasks cleared');
    } catch (error) {
      localStorage.removeItem('tf_guest_tasks');
    }
  }

  async count(): Promise<number> {
    try {
      return await this.withTransaction('readonly', (store) => store.count());
    } catch (error) {
      const tasks = this.listFromLocalStorage();
      return tasks.length;
    }
  }

  // localStorage Fallback Methods
  private listFromLocalStorage(): Task[] {
    const stored = localStorage.getItem('tf_guest_tasks');
    return stored ? JSON.parse(stored) : [];
  }

  private getFromLocalStorage(id: string): Task | null {
    const tasks = this.listFromLocalStorage();
    return tasks.find(t => t.id === id) || null;
  }

  private upsertToLocalStorage(item: Task): Task {
    const tasks = this.listFromLocalStorage();
    const index = tasks.findIndex(t => t.id === item.id);
    
    if (index >= 0) {
      tasks[index] = item;
    } else {
      tasks.push(item);
    }
    
    localStorage.setItem('tf_guest_tasks', JSON.stringify(tasks));
    return item;
  }

  private removeFromLocalStorage(id: string): void {
    const tasks = this.listFromLocalStorage();
    const filtered = tasks.filter(t => t.id !== id);
    localStorage.setItem('tf_guest_tasks', JSON.stringify(filtered));
  }
}

const guestStoreInstance = new GuestStore();
export default guestStoreInstance;
