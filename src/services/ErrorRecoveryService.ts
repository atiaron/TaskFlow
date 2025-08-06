/**
 * ErrorRecoveryService - Intelligent Error Recovery and Network Management
 * 
 * Purpose: Handles network failures, offline scenarios, and provides
 * graceful degradation with automatic recovery mechanisms
 * 
 * Features:
 * - Network status monitoring
 * - Offline message queueing
 * - Automatic retry with exponential backoff
 * - Firebase connection recovery
 * - Session recovery after failures
 * 
 * @author TaskFlow Development Team
 * @version 1.0.0
 * @date 2025-08-06
 */

import { ChatMessage, ChatSession, Task } from '../types/index';
import { AuthService } from './AuthService';
import { FirebaseService } from './FirebaseService';
import { PerformanceMonitor } from './PerformanceMonitor';
import { StorageService } from './StorageService';

interface QueuedOperation {
  id: string;
  type: 'message' | 'session' | 'task';
  operation: 'create' | 'update' | 'delete';
  data: any;
  userId: string;
  sessionId?: string;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}

interface NetworkStatus {
  isOnline: boolean;
  lastOnline: Date;
  connectionType: string;
  effectiveType: string;
}

interface RecoveryResult {
  success: boolean;
  operationsProcessed: number;
  errors: string[];
  timestamp: Date;
}

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService | null = null;
  private operationQueue: QueuedOperation[] = [];
  private isProcessingQueue = false;
  private networkStatus: NetworkStatus;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  // Configuration
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly RETRY_DELAYS = [1000, 3000, 7000, 15000, 30000]; // Progressive delays
  private readonly QUEUE_STORAGE_KEY = 'taskflow_offline_queue';
  private readonly NETWORK_CHECK_INTERVAL = 5000; // 5 seconds

  private constructor() {
    this.networkStatus = {
      isOnline: navigator.onLine,
      lastOnline: new Date(),
      connectionType: this.getConnectionType(),
      effectiveType: this.getEffectiveConnectionType()
    };
    
    this.initializeService();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  /**
   * Initialize service with event listeners
   */
  private initializeService(): void {
    // Network status listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Load queued operations from localStorage
    this.loadQueueFromStorage();
    
    // Start periodic network checks
    setInterval(this.checkNetworkStatus.bind(this), this.NETWORK_CHECK_INTERVAL);
    
    console.log('🛡️ ErrorRecoveryService initialized');
  }

  /**
   * Save message with automatic retry on failure
   */
  public async saveMessageWithRetry(
    userId: string, 
    sessionId: string, 
    message: Omit<ChatMessage, 'id'>
  ): Promise<string> {
    try {
      // Try immediate save if online
      if (this.networkStatus.isOnline) {
        const messageId = await FirebaseService.saveChatMessage(userId, sessionId, message);
        console.log('✅ Message saved immediately:', messageId);
        return messageId;
      }
      
      // Queue for offline processing
      const queuedOp: QueuedOperation = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'message',
        operation: 'create',
        data: { ...message, chat_id: sessionId },
        userId,
        sessionId,
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 5
      };
      
      this.addToQueue(queuedOp);
      
      // Save to localStorage immediately for user feedback
      this.saveToLocalStorage(queuedOp);
      
      console.log('📮 Message queued for offline processing:', queuedOp.id);
      return queuedOp.id;
      
    } catch (error) {
      console.error('❌ Error saving message:', error);
      
      // Queue the operation for retry
      const queuedOp: QueuedOperation = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'message',
        operation: 'create',
        data: { ...message, chat_id: sessionId },
        userId,
        sessionId,
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3,
        lastError: error instanceof Error ? error.message : String(error)
      };
      
      this.addToQueue(queuedOp);
      throw error;
    }
  }

  /**
   * Restore operations from localStorage after app restart
   */
  public async restoreFromLocalStorage(userId: string): Promise<void> {
    try {
      const savedQueue = localStorage.getItem(this.QUEUE_STORAGE_KEY);
      if (!savedQueue) return;
      
      const operations: QueuedOperation[] = JSON.parse(savedQueue);
      const userOperations = operations.filter(op => op.userId === userId);
      
      console.log(`🔄 Restoring ${userOperations.length} operations for user ${userId}`);
      
      // Restore operations to queue
      userOperations.forEach(op => {
        // Reset retry count for fresh start
        op.retryCount = 0;
        this.operationQueue.push(op);
      });
      
      // Process queue if online
      if (this.networkStatus.isOnline) {
        this.processQueue();
      }
      
    } catch (error) {
      console.error('❌ Error restoring from localStorage:', error);
    }
  }

  /**
   * Initialize network monitoring
   */
  public initializeNetworkMonitoring(): void {
    // Already initialized in constructor
    console.log('📡 Network monitoring active:', this.networkStatus);
  }

  /**
   * Check if device is online
   */
  public isOnline(): boolean {
    return this.networkStatus.isOnline;
  }

  /**
   * Get current network status
   */
  public getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  /**
   * Get queue statistics
   */
  public getQueueStats(): {
    queueSize: number;
    pendingMessages: number;
    pendingSessions: number;
    pendingTasks: number;
    oldestOperation?: Date;
  } {
    const messageOps = this.operationQueue.filter(op => op.type === 'message');
    const sessionOps = this.operationQueue.filter(op => op.type === 'session');
    const taskOps = this.operationQueue.filter(op => op.type === 'task');
    
    return {
      queueSize: this.operationQueue.length,
      pendingMessages: messageOps.length,
      pendingSessions: sessionOps.length,
      pendingTasks: taskOps.length,
      oldestOperation: this.operationQueue.length > 0 
        ? new Date(Math.min(...this.operationQueue.map(op => op.timestamp.getTime())))
        : undefined
    };
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('🟢 Network connection restored');
    
    this.networkStatus.isOnline = true;
    this.networkStatus.lastOnline = new Date();
    this.networkStatus.connectionType = this.getConnectionType();
    this.networkStatus.effectiveType = this.getEffectiveConnectionType();
    
    // Emit custom event for UI updates
    window.dispatchEvent(new CustomEvent('network-status-change', {
      detail: { status: 'online', networkInfo: this.networkStatus }
    }));
    
    // Process queued operations
    this.processQueue();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('🔴 Network connection lost');
    
    this.networkStatus.isOnline = false;
    
    // Emit custom event for UI updates
    window.dispatchEvent(new CustomEvent('network-status-change', {
      detail: { status: 'offline', networkInfo: this.networkStatus }
    }));
  }

  /**
   * Add operation to queue
   */
  private addToQueue(operation: QueuedOperation): void {
    // Prevent queue overflow
    if (this.operationQueue.length >= this.MAX_QUEUE_SIZE) {
      console.warn('⚠️ Queue is full, removing oldest operation');
      this.operationQueue.shift();
    }
    
    this.operationQueue.push(operation);
    this.saveQueueToStorage();
  }

  /**
   * Process queued operations
   */
  private async processQueue(): Promise<RecoveryResult> {
    if (this.isProcessingQueue || this.operationQueue.length === 0) {
      return {
        success: true,
        operationsProcessed: 0,
        errors: [],
        timestamp: new Date()
      };
    }
    
    this.isProcessingQueue = true;
    let processedCount = 0;
    const errors: string[] = [];
    
    console.log(`🔄 Processing ${this.operationQueue.length} queued operations`);
    
    while (this.operationQueue.length > 0 && this.networkStatus.isOnline) {
      const operation = this.operationQueue[0];
      
      try {
        await this.processOperation(operation);
        this.operationQueue.shift(); // Remove processed operation
        processedCount++;
        
        // Clear any existing retry timeout
        const timeoutId = this.retryTimeouts.get(operation.id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          this.retryTimeouts.delete(operation.id);
        }
        
      } catch (error) {
        console.error(`❌ Error processing operation ${operation.id}:`, error);
        
        operation.retryCount++;
        operation.lastError = error instanceof Error ? error.message : String(error);
        
        if (operation.retryCount >= operation.maxRetries) {
          console.error(`🚫 Operation ${operation.id} failed after ${operation.maxRetries} retries`);
          this.operationQueue.shift(); // Remove failed operation
          errors.push(`Operation ${operation.id}: ${operation.lastError}`);
        } else {
          // Schedule retry with exponential backoff
          this.scheduleRetry(operation);
          break; // Stop processing for now
        }
      }
    }
    
    this.isProcessingQueue = false;
    this.saveQueueToStorage();
    
    const result: RecoveryResult = {
      success: errors.length === 0,
      operationsProcessed: processedCount,
      errors,
      timestamp: new Date()
    };
    
    // Emit recovery event
    window.dispatchEvent(new CustomEvent('recovery-complete', { detail: result }));
    
    return result;
  }

  /**
   * Process individual operation
   */
  private async processOperation(operation: QueuedOperation): Promise<void> {
    switch (operation.type) {
      case 'message':
        if (operation.operation === 'create') {
          await FirebaseService.saveChatMessage(
            operation.userId,
            operation.sessionId!,
            operation.data
          );
        }
        break;
        
      case 'session':
        if (operation.operation === 'create') {
          await FirebaseService.createChatSession(operation.userId, operation.data.title);
        } else if (operation.operation === 'update') {
          await FirebaseService.updateChatSession(
            operation.userId,
            operation.data.sessionId,
            operation.data.updates
          );
        } else if (operation.operation === 'delete') {
          await FirebaseService.deleteChatSession(operation.userId, operation.data.sessionId);
        }
        break;
        
      case 'task':
        if (operation.operation === 'create') {
          await FirebaseService.addTask(operation.userId, operation.data);
        } else if (operation.operation === 'update') {
          await FirebaseService.updateTask(
            operation.userId,
            operation.data.taskId,
            operation.data.updates
          );
        } else if (operation.operation === 'delete') {
          await FirebaseService.deleteTask(operation.userId, operation.data.taskId);
        }
        break;
        
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Schedule retry with exponential backoff
   */
  private scheduleRetry(operation: QueuedOperation): void {
    const delayIndex = Math.min(operation.retryCount - 1, this.RETRY_DELAYS.length - 1);
    const delay = this.RETRY_DELAYS[delayIndex];
    
    console.log(`⏰ Scheduling retry for operation ${operation.id} in ${delay}ms`);
    
    const timeoutId = setTimeout(() => {
      this.retryTimeouts.delete(operation.id);
      if (this.networkStatus.isOnline) {
        this.processQueue();
      }
    }, delay);
    
    this.retryTimeouts.set(operation.id, timeoutId);
  }

  /**
   * Save operation queue to localStorage
   */
  private saveQueueToStorage(): void {
    try {
      localStorage.setItem(this.QUEUE_STORAGE_KEY, JSON.stringify(this.operationQueue));
    } catch (error) {
      console.error('❌ Error saving queue to localStorage:', error);
    }
  }

  /**
   * Load operation queue from localStorage
   */
  private loadQueueFromStorage(): void {
    try {
      const savedQueue = localStorage.getItem(this.QUEUE_STORAGE_KEY);
      if (savedQueue) {
        this.operationQueue = JSON.parse(savedQueue).map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp)
        }));
        console.log(`📥 Loaded ${this.operationQueue.length} operations from storage`);
      }
    } catch (error) {
      console.error('❌ Error loading queue from localStorage:', error);
      this.operationQueue = [];
    }
  }

  /**
   * Save individual operation to localStorage for immediate feedback
   */
  private saveToLocalStorage(operation: QueuedOperation): void {
    try {
      if (operation.type === 'message') {
        // Save message locally for immediate UI feedback
        const localMessages = JSON.parse(localStorage.getItem('local_messages') || '[]');
        localMessages.push({
          id: operation.id,
          content: operation.data.content,
          sender: operation.data.sender,
          timestamp: operation.timestamp,
          sessionId: operation.sessionId,
          status: 'pending'
        });
        localStorage.setItem('local_messages', JSON.stringify(localMessages));
      }
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
    }
  }

  /**
   * Check network status periodically
   */
  private checkNetworkStatus(): void {
    const wasOnline = this.networkStatus.isOnline;
    const isOnline = navigator.onLine;
    
    if (wasOnline !== isOnline) {
      if (isOnline) {
        this.handleOnline();
      } else {
        this.handleOffline();
      }
    }
  }

  /**
   * Get connection type
   */
  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.type || 'unknown';
  }

  /**
   * Get effective connection type
   */
  private getEffectiveConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  /**
   * Clear all queued operations (for testing)
   */
  public clearQueue(): void {
    this.operationQueue = [];
    this.saveQueueToStorage();
    
    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    
    console.log('🧹 Queue cleared');
  }

  /**
   * Force process queue (for testing)
   */
  public async forceProcessQueue(): Promise<RecoveryResult> {
    return await this.processQueue();
  }

  /**
   * Get diagnostic information
   */
  public getDiagnostics(): {
    networkStatus: NetworkStatus;
    queueStats: {
      queueSize: number;
      pendingMessages: number;
      pendingSessions: number;
      pendingTasks: number;
      oldestOperation?: Date;
    };
    retryTimeouts: number;
    isProcessing: boolean;
  } {
    return {
      networkStatus: this.getNetworkStatus(),
      queueStats: this.getQueueStats(),
      retryTimeouts: this.retryTimeouts.size,
      isProcessing: this.isProcessingQueue
    };
  }
}
