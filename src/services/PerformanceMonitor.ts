/**
 * PerformanceMonitor - Real-time Performance Monitoring and Optimization
 * 
 * Purpose: Monitors application performance, tracks metrics, and provides
 * optimization recommendations for TaskFlow
 * 
 * Features:
 * - Operation timing and benchmarking
 * - Memory usage tracking
 * - Network performance monitoring
 * - User experience metrics
 * - Performance alerts and recommendations
 * 
 * @author TaskFlow Development Team
 * @version 1.0.0
 * @date 2025-08-06
 */

interface PerformanceTarget {
  createSession: number;    // < 1000ms
  saveMessage: number;      // < 500ms
  loadHistory: number;      // < 2000ms
  syncSessions: number;     // < 1500ms
  claudeResponse: number;   // < 10000ms
}

interface TimingResult {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  metadata?: Record<string, any>;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  totalOperations: number;
  successRate: number;
  errorRate: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: Date;
}

interface NetworkMetrics {
  latency: number;
  bandwidth: string;
  connectionType: string;
  effectiveType: string;
  rtt: number;
  downlink: number;
}

interface UserExperienceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  interactionToNextPaint: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private timings: Map<string, TimingResult[]> = new Map();
  private activeTimers: Map<string, { start: number; metadata?: any }> = new Map();
  
  // Performance targets (ms)
  private readonly TARGETS: PerformanceTarget = {
    createSession: 1000,
    saveMessage: 500,
    loadHistory: 2000,
    syncSessions: 1500,
    claudeResponse: 10000
  };

  // Alert thresholds
  private readonly ALERT_THRESHOLDS = {
    memoryUsage: 100 * 1024 * 1024, // 100MB
    responseTime: 5000, // 5 seconds
    errorRate: 0.1, // 10%
    consecutiveFailures: 3
  };

  private constructor() {
    this.initializeMonitoring();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    // Monitor memory usage
    setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Every 30 seconds

    // Monitor network conditions
    this.monitorNetworkConditions();

    // Set up error listeners
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    console.log('📊 PerformanceMonitor initialized');
  }

  /**
   * Start timing an operation
   * @param operation - Operation name
   * @param metadata - Additional metadata
   * @returns Timing ID for ending the measurement
   */
  public static startTiming(operation: string, metadata?: Record<string, any>): string {
    const instance = PerformanceMonitor.getInstance();
    const timingId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    instance.activeTimers.set(timingId, {
      start: performance.now(),
      metadata
    });
    
    return timingId;
  }

  /**
   * End timing an operation
   * @param timingId - Timing ID from startTiming
   * @param success - Whether operation was successful
   * @returns Duration in milliseconds
   */
  public static endTiming(timingId: string, success: boolean = true): number {
    const instance = PerformanceMonitor.getInstance();
    const timer = instance.activeTimers.get(timingId);
    
    if (!timer) {
      console.warn(`⚠️ Timer ${timingId} not found`);
      return 0;
    }
    
    const duration = performance.now() - timer.start;
    const operation = timingId.split('_')[0];
    
    const result: TimingResult = {
      operation,
      duration,
      timestamp: new Date(),
      success,
      metadata: timer.metadata
    };
    
    // Store result
    if (!instance.timings.has(operation)) {
      instance.timings.set(operation, []);
    }
    instance.timings.get(operation)!.push(result);
    
    // Keep only last 100 results per operation
    const results = instance.timings.get(operation)!;
    if (results.length > 100) {
      results.shift();
    }
    
    // Check against targets
    instance.checkPerformanceTarget(operation, duration, success);
    
    // Clean up
    instance.activeTimers.delete(timingId);
    
    return duration;
  }

  /**
   * Get performance metrics for an operation
   * @param operation - Operation name
   * @returns Performance metrics
   */
  public static getMetrics(operation?: string): Record<string, PerformanceMetrics> {
    const instance = PerformanceMonitor.getInstance();
    const metrics: Record<string, PerformanceMetrics> = {};
    
    const operations = operation ? [operation] : Array.from(instance.timings.keys());
    
    operations.forEach(op => {
      const results = instance.timings.get(op) || [];
      if (results.length === 0) {
        return;
      }
      
      const durations = results.map(r => r.duration);
      const successfulResults = results.filter(r => r.success);
      
      metrics[op] = {
        averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
        maxResponseTime: Math.max(...durations),
        minResponseTime: Math.min(...durations),
        totalOperations: results.length,
        successRate: successfulResults.length / results.length,
        errorRate: (results.length - successfulResults.length) / results.length
      };
    });
    
    return metrics;
  }

  /**
   * Get current memory usage
   */
  public static getMemoryUsage(): MemoryInfo | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: new Date()
      };
    }
    return null;
  }

  /**
   * Get network performance metrics
   */
  public static getNetworkMetrics(): NetworkMetrics | null {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!connection) {
      return null;
    }
    
    return {
      latency: 0, // Will be measured dynamically
      bandwidth: connection.effectiveType || 'unknown',
      connectionType: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
      rtt: connection.rtt || 0,
      downlink: connection.downlink || 0
    };
  }

  /**
   * Get user experience metrics
   */
  public static getUserExperienceMetrics(): UserExperienceMetrics | null {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      // Get paint metrics
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      // Get LCP
      let lcp = 0;
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          lcp = lastEntry.startTime;
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      }
      
      return {
        firstContentfulPaint: fcpEntry ? fcpEntry.startTime : 0,
        largestContentfulPaint: lcp,
        cumulativeLayoutShift: 0, // Would need layout shift observer
        firstInputDelay: 0, // Would need first input observer
        interactionToNextPaint: 0 // Would need interaction observer
      };
    } catch (error) {
      console.error('❌ Error getting UX metrics:', error);
      return null;
    }
  }

  /**
   * Check if operation meets performance target
   */
  private checkPerformanceTarget(operation: string, duration: number, success: boolean): void {
    const target = this.TARGETS[operation as keyof PerformanceTarget];
    
    if (target && duration > target) {
      console.warn(`⚠️ Performance target missed for ${operation}: ${duration}ms > ${target}ms`);
      
      // Emit performance warning event
      window.dispatchEvent(new CustomEvent('performance-warning', {
        detail: {
          operation,
          duration,
          target,
          success,
          timestamp: new Date()
        }
      }));
    }
    
    if (!success) {
      console.error(`❌ Operation failed: ${operation} (${duration}ms)`);
      
      // Check for consecutive failures
      this.checkConsecutiveFailures(operation);
    }
  }

  /**
   * Check for consecutive failures
   */
  private checkConsecutiveFailures(operation: string): void {
    const results = this.timings.get(operation) || [];
    const recentResults = results.slice(-this.ALERT_THRESHOLDS.consecutiveFailures);
    
    if (recentResults.length === this.ALERT_THRESHOLDS.consecutiveFailures &&
        recentResults.every(r => !r.success)) {
      
      console.error(`🚨 Consecutive failures detected for ${operation}`);
      
      // Emit critical error event
      window.dispatchEvent(new CustomEvent('performance-critical', {
        detail: {
          operation,
          consecutiveFailures: this.ALERT_THRESHOLDS.consecutiveFailures,
          timestamp: new Date()
        }
      }));
    }
  }

  /**
   * Monitor memory usage
   */
  private checkMemoryUsage(): void {
    const memory = PerformanceMonitor.getMemoryUsage();
    
    if (memory && memory.usedJSHeapSize > this.ALERT_THRESHOLDS.memoryUsage) {
      console.warn(`⚠️ High memory usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      
      window.dispatchEvent(new CustomEvent('memory-warning', {
        detail: {
          memoryUsage: memory,
          threshold: this.ALERT_THRESHOLDS.memoryUsage,
          timestamp: new Date()
        }
      }));
    }
  }

  /**
   * Monitor network conditions
   */
  private monitorNetworkConditions(): void {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', () => {
        const metrics = PerformanceMonitor.getNetworkMetrics();
        
        window.dispatchEvent(new CustomEvent('network-change', {
          detail: {
            networkMetrics: metrics,
            timestamp: new Date()
          }
        }));
      });
    }
  }

  /**
   * Handle JavaScript errors
   */
  private handleError(event: ErrorEvent): void {
    console.error('🐛 JavaScript Error:', event.error);
    
    // Track error
    this.trackError({
      type: 'javascript',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    console.error('🔴 Unhandled Promise Rejection:', event.reason);
    
    // Track error
    this.trackError({
      type: 'promise_rejection',
      reason: event.reason,
      timestamp: new Date()
    });
  }

  /**
   * Track error for analytics
   */
  private trackError(errorInfo: any): void {
    // Store error info (could send to analytics service)
    const errors = JSON.parse(localStorage.getItem('taskflow_errors') || '[]');
    errors.push({
      ...errorInfo,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Keep only last 50 errors
    if (errors.length > 50) {
      errors.shift();
    }
    
    localStorage.setItem('taskflow_errors', JSON.stringify(errors));
    
    // Emit error event
    window.dispatchEvent(new CustomEvent('error-tracked', {
      detail: errorInfo
    }));
  }

  /**
   * Get performance report
   */
  public static getPerformanceReport(): {
    metrics: Record<string, PerformanceMetrics>;
    memory: MemoryInfo | null;
    network: NetworkMetrics | null;
    userExperience: UserExperienceMetrics | null;
    targets: PerformanceTarget;
    timestamp: Date;
  } {
    const instance = PerformanceMonitor.getInstance();
    
    return {
      metrics: PerformanceMonitor.getMetrics(),
      memory: PerformanceMonitor.getMemoryUsage(),
      network: PerformanceMonitor.getNetworkMetrics(),
      userExperience: PerformanceMonitor.getUserExperienceMetrics(),
      targets: instance.TARGETS,
      timestamp: new Date()
    };
  }

  /**
   * Clear all performance data (for testing)
   */
  public static clearData(): void {
    const instance = PerformanceMonitor.getInstance();
    instance.timings.clear();
    instance.activeTimers.clear();
    localStorage.removeItem('taskflow_errors');
    console.log('🧹 Performance data cleared');
  }

  /**
   * Export performance data
   */
  public static exportData(): string {
    const instance = PerformanceMonitor.getInstance();
    
    const data = {
      metrics: PerformanceMonitor.getMetrics(),
      timings: Object.fromEntries(instance.timings),
      memory: PerformanceMonitor.getMemoryUsage(),
      network: PerformanceMonitor.getNetworkMetrics(),
      userExperience: PerformanceMonitor.getUserExperienceMetrics(),
      targets: instance.TARGETS,
      exportDate: new Date()
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Convenient timing wrapper for async functions
   */
  public static async time<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const timingId = PerformanceMonitor.startTiming(operation, metadata);
    
    try {
      const result = await fn();
      PerformanceMonitor.endTiming(timingId, true);
      return result;
    } catch (error) {
      PerformanceMonitor.endTiming(timingId, false);
      throw error;
    }
  }
}
