// Storage Interface משותף לGuest ו-Cloud
import { Task } from '../types';

export interface IStore {
  // CRUD בסיסי
  list(): Promise<Task[]>;
  get(id: string): Promise<Task | null>;
  upsert(item: Task): Promise<Task>;
  remove(id: string): Promise<void>;
  
  // Batch operations לSync
  bulkUpsert(items: Task[]): Promise<Task[]>;
  bulkRemove(ids: string[]): Promise<void>;
  
  // Meta operations
  clear(): Promise<void>;
  count(): Promise<number>;
}

export interface SyncResult {
  pulled: Task[];
  pushed: Task[];
  conflicts: Task[];
  resolved: Task[];
}

export interface SyncStats {
  localCount: number;
  remoteCount: number;
  mergedCount: number;
  conflictsResolved: number;
}
