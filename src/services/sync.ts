// Sync Service - מיזוג נתוני Guest ו-Cloud
import { Task } from '../types';
import { IStore, SyncResult, SyncStats } from '../storage/IStore';
import guestStore from '../storage/guestStore';
import cloudStore from '../storage/cloudStore';

class SyncService {
  private isGuestMode = true;
  private currentStore: IStore = guestStore;

  // Switch between Guest and Cloud modes
  setMode(isGuest: boolean, userId?: string): void {
    this.isGuestMode = isGuest;
    
    if (isGuest) {
      this.currentStore = guestStore;
      console.log('🔧 Sync Service: Switched to Guest mode');
    } else {
      if (!userId) {
        throw new Error('❌ Sync Service: User ID required for Cloud mode');
      }
      cloudStore.setUserId(userId);
      this.currentStore = cloudStore;
      console.log(`🔧 Sync Service: Switched to Cloud mode for user ${userId}`);
    }
  }

  // Get current active store
  getStore(): IStore {
    return this.currentStore;
  }

  // Check if in guest mode
  isInGuestMode(): boolean {
    return this.isGuestMode;
  }

  // Sync Guest data to Cloud on login
  async mergeOnLogin(userId: string): Promise<SyncResult> {
    console.log('🔄 Sync Service: Starting merge on login...');
    
    try {
      // Get all local Guest tasks
      const localTasks = await guestStore.list();
      console.log(`📥 Sync Service: Found ${localTasks.length} local Guest tasks`);
      
      // Setup cloud store for user
      cloudStore.setUserId(userId);
      
      // Get all remote Cloud tasks
      const remoteTasks = await cloudStore.list();
      console.log(`☁️ Sync Service: Found ${remoteTasks.length} remote Cloud tasks`);
      
      // Perform diff and merge
      const result = await this.performMerge(localTasks, remoteTasks);
      
      // Switch to Cloud mode after successful merge
      this.setMode(false, userId);
      
      console.log('✅ Sync Service: Merge completed successfully');
      console.log(`📊 Sync Stats: Pulled ${result.pulled.length}, Pushed ${result.pushed.length}, Conflicts ${result.conflicts.length}`);
      
      return result;
    } catch (error) {
      console.error('❌ Sync Service: Merge failed:', error);
      throw error;
    }
  }

  // Core merge logic with Last-Write-Wins conflict resolution
  private async performMerge(localTasks: Task[], remoteTasks: Task[]): Promise<SyncResult> {
    const result: SyncResult = {
      pulled: [],
      pushed: [],
      conflicts: [],
      resolved: []
    };

    // Create maps for efficient lookup
    const localMap = new Map<string, Task>();
    const remoteMap = new Map<string, Task>();
    
    localTasks.forEach(task => localMap.set(task.id, task));
    remoteTasks.forEach(task => remoteMap.set(task.id, task));

    // Find tasks that need to be pushed to cloud (local only or newer local)
    const tasksToPush: Task[] = [];
    
    localTasks.forEach(localTask => {
      const remoteTask = remoteMap.get(localTask.id);
      
      if (!remoteTask) {
        // Local only - push to cloud
        tasksToPush.push(localTask);
        result.pushed.push(localTask);
      } else {
        // Both exist - check timestamps for conflict resolution
        const localTime = localTask.updatedAt ? new Date(localTask.updatedAt).getTime() : 0;
        const remoteTime = remoteTask.updatedAt ? new Date(remoteTask.updatedAt).getTime() : 0;
        
        if (localTime > remoteTime) {
          // Local is newer - push to cloud
          tasksToPush.push(localTask);
          result.conflicts.push(remoteTask);
          result.resolved.push(localTask);
          console.log(`🔀 Sync Service: Local task ${localTask.id} is newer, pushing to cloud`);
        } else if (remoteTime > localTime) {
          // Remote is newer - will be pulled automatically
          result.conflicts.push(localTask);
          result.resolved.push(remoteTask);
          console.log(`🔀 Sync Service: Remote task ${localTask.id} is newer, keeping remote version`);
        }
        // If timestamps are equal, keep remote version (stable resolution)
      }
    });

    // Find tasks that need to be pulled from cloud (remote only)
    remoteTasks.forEach(remoteTask => {
      if (!localMap.has(remoteTask.id)) {
        result.pulled.push(remoteTask);
      }
    });

    // Execute push operations
    if (tasksToPush.length > 0) {
      await cloudStore.bulkUpsert(tasksToPush);
      console.log(`📤 Sync Service: Pushed ${tasksToPush.length} tasks to cloud`);
    }

    // Note: Pull operations don't need explicit execution as we'll switch to cloud store
    console.log(`📥 Sync Service: ${result.pulled.length} tasks will be available from cloud store`);

    return result;
  }

  // Reset to Guest mode on logout
  async resetToGuestMode(): Promise<void> {
    console.log('🔄 Sync Service: Resetting to Guest mode...');
    
    // Switch back to guest store
    this.setMode(true);
    
    // Clear cloud store user context
    cloudStore.setUserId(null);
    
    console.log('✅ Sync Service: Reset to Guest mode completed');
  }

  // Get sync statistics
  async getSyncStats(): Promise<SyncStats> {
    const localCount = await guestStore.count();
    const remoteCount = this.isGuestMode ? 0 : await cloudStore.count();
    
    return {
      localCount,
      remoteCount,
      mergedCount: this.isGuestMode ? localCount : remoteCount,
      conflictsResolved: 0 // This would be tracked during actual sync
    };
  }

  // Helper method for development - clear all data
  async clearAllData(): Promise<void> {
    console.log('🧹 Sync Service: Clearing all data...');
    
    await guestStore.clear();
    if (!this.isGuestMode) {
      await cloudStore.clear();
    }
    
    console.log('✅ Sync Service: All data cleared');
  }
}

const syncServiceInstance = new SyncService();
export default syncServiceInstance;
