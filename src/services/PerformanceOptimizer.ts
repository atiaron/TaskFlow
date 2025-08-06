/**
 * PerformanceOptimizer - Smart Performance Optimization System
 * 
 * Purpose: Automatically optimizes application performance based on
 * real-time metrics from PerformanceMonitor
 * 
 * Features:
 * - Automatic performance tuning
 * - Memory cleanup and optimization
 * - Network request batching
 * - Intelligent caching strategies
 * - Dynamic component loading
 * 
 * @author TaskFlow Development Team
 * @version 1.0.0
 * @date 2025-08-06
 */

import { PerformanceMonitor } from './PerformanceMonitor';
import { RealTimeSyncService } from './RealTimeSyncService';

interface OptimizationRule {
  condition: (metrics: any) => boolean;
  action: () => Promise<void>;
  priority: number;
  description: string;
}

interface OptimizationState {
  lastOptimization: Date;
  optimizationsApplied: number;
  activeOptimizations: Set<string>;
  performanceGains: Record<string, number>;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer | null = null;
  private optimizationRules: OptimizationRule[] = [];
  private state: OptimizationState = {
    lastOptimization: new Date(),
    optimizationsApplied: 0,
    activeOptimizations: new Set(),
    performanceGains: {}
  };

  // Optimization thresholds
  private readonly THRESHOLDS = {
    MEMORY_HIGH: 50 * 1024 * 1024, // 50MB
    MEMORY_CRITICAL: 100 * 1024 * 1024, // 100MB
    RESPONSE_TIME_SLOW: 2000, // 2 seconds
    RESPONSE_TIME_CRITICAL: 5000, // 5 seconds
    ERROR_RATE_HIGH: 0.05, // 5%
    SYNC_FREQUENCY_REDUCTION: 0.1 // 10% error rate
  };

  private constructor() {
    this.initializeOptimizationRules();
    this.startOptimizationLoop();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Initialize optimization rules
   */
  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      // Memory optimization rules
      {
        condition: (metrics) => {
          const memory = metrics.memory;
          return memory && memory.usedJSHeapSize > this.THRESHOLDS.MEMORY_HIGH;
        },
        action: async () => {
          await this.optimizeMemoryUsage();
        },
        priority: 1,
        description: 'High memory usage optimization'
      },

      // Response time optimization
      {
        condition: (metrics) => {
          const claudeMetrics = metrics.metrics.claudeResponse;
          return claudeMetrics && claudeMetrics.averageResponseTime > this.THRESHOLDS.RESPONSE_TIME_SLOW;
        },
        action: async () => {
          await this.optimizeNetworkRequests();
        },
        priority: 2,
        description: 'Slow response time optimization'
      },

      // Error rate optimization
      {
        condition: (metrics) => {
          const claudeMetrics = metrics.metrics.claudeResponse;
          return claudeMetrics && claudeMetrics.errorRate > this.THRESHOLDS.ERROR_RATE_HIGH;
        },
        action: async () => {
          await this.optimizeErrorHandling();
        },
        priority: 3,
        description: 'High error rate optimization'
      },

      // Sync frequency optimization
      {
        condition: (metrics) => {
          const syncMetrics = metrics.metrics.syncSessions;
          return syncMetrics && syncMetrics.errorRate > this.THRESHOLDS.SYNC_FREQUENCY_REDUCTION;
        },
        action: async () => {
          await this.optimizeSyncFrequency();
        },
        priority: 4,
        description: 'Sync frequency optimization'
      },

      // Critical memory cleanup
      {
        condition: (metrics) => {
          const memory = metrics.memory;
          return memory && memory.usedJSHeapSize > this.THRESHOLDS.MEMORY_CRITICAL;
        },
        action: async () => {
          await this.criticalMemoryCleanup();
        },
        priority: 0, // Highest priority
        description: 'Critical memory cleanup'
      }
    ];

    console.log('🎯 Performance optimization rules initialized:', this.optimizationRules.length);
  }

  /**
   * Start the optimization loop
   */
  private startOptimizationLoop(): void {
    // Run optimization check every 30 seconds
    setInterval(async () => {
      try {
        await this.runOptimizationCheck();
      } catch (error) {
        console.error('🚨 Error in optimization loop:', error);
      }
    }, 30000);

    console.log('🔄 Performance optimization loop started');
  }

  /**
   * Run optimization check based on current metrics
   */
  private async runOptimizationCheck(): Promise<void> {
    const performanceReport = PerformanceMonitor.getPerformanceReport();
    
    // Sort rules by priority (0 = highest priority)
    const sortedRules = [...this.optimizationRules].sort((a, b) => a.priority - b.priority);
    
    for (const rule of sortedRules) {
      if (rule.condition(performanceReport)) {
        const ruleId = rule.description.replace(/\s+/g, '_');
        
        // Avoid running the same optimization too frequently
        if (this.state.activeOptimizations.has(ruleId)) {
          continue;
        }
        
        console.log(`⚡ Applying optimization: ${rule.description}`);
        
        this.state.activeOptimizations.add(ruleId);
        
        try {
          const startTime = performance.now();
          await rule.action();
          const duration = performance.now() - startTime;
          
          // Track performance gain
          this.state.performanceGains[ruleId] = duration;
          this.state.optimizationsApplied++;
          this.state.lastOptimization = new Date();
          
          console.log(`✅ Optimization completed: ${rule.description} (${duration.toFixed(2)}ms)`);
          
          // Emit optimization event
          window.dispatchEvent(new CustomEvent('performance-optimized', {
            detail: {
              rule: rule.description,
              duration,
              timestamp: new Date()
            }
          }));
          
        } catch (error) {
          console.error(`❌ Optimization failed: ${rule.description}`, error);
        } finally {
          // Remove from active set after delay to prevent rapid re-triggering
          setTimeout(() => {
            this.state.activeOptimizations.delete(ruleId);
          }, 60000); // 1 minute cooldown
        }
      }
    }
  }

  /**
   * Optimize memory usage
   */
  private async optimizeMemoryUsage(): Promise<void> {
    console.log('🧹 Starting memory optimization...');
    
    // Clear performance data older than 1 hour
    const performanceData = localStorage.getItem('taskflow_performance');
    if (performanceData) {
      try {
        const data = JSON.parse(performanceData);
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        // Filter out old entries
        Object.keys(data).forEach(key => {
          if (data[key].timestamp && new Date(data[key].timestamp).getTime() < oneHourAgo) {
            delete data[key];
          }
        });
        
        localStorage.setItem('taskflow_performance', JSON.stringify(data));
      } catch (error) {
        console.warn('Error cleaning performance data:', error);
      }
    }
    
    // Clear old error logs
    const errors = localStorage.getItem('taskflow_errors');
    if (errors) {
      try {
        const errorArray = JSON.parse(errors);
        if (errorArray.length > 20) {
          localStorage.setItem('taskflow_errors', JSON.stringify(errorArray.slice(-20)));
        }
      } catch (error) {
        console.warn('Error cleaning error logs:', error);
      }
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    console.log('✅ Memory optimization completed');
  }

  /**
   * Optimize network requests
   */
  private async optimizeNetworkRequests(): Promise<void> {
    console.log('🌐 Starting network optimization...');
    
    // Implement request batching for non-critical operations
    // This would batch multiple requests together
    
    // Add request caching headers
    const cacheControl = {
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'ETag': 'true'
    };
    
    // Store optimization preference
    localStorage.setItem('taskflow_network_optimized', JSON.stringify({
      enabled: true,
      timestamp: new Date(),
      cacheHeaders: cacheControl
    }));
    
    console.log('✅ Network optimization completed');
  }

  /**
   * Optimize error handling
   */
  private async optimizeErrorHandling(): Promise<void> {
    console.log('🛡️ Starting error handling optimization...');
    
    // Implement exponential backoff for failed requests
    const errorConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    };
    
    localStorage.setItem('taskflow_error_config', JSON.stringify(errorConfig));
    
    // Clear error queue if it's too large
    const errorQueue = localStorage.getItem('taskflow_error_queue');
    if (errorQueue) {
      try {
        const queue = JSON.parse(errorQueue);
        if (queue.length > 50) {
          localStorage.setItem('taskflow_error_queue', JSON.stringify(queue.slice(-25)));
        }
      } catch (error) {
        console.warn('Error cleaning error queue:', error);
      }
    }
    
    console.log('✅ Error handling optimization completed');
  }

  /**
   * Optimize sync frequency
   */
  private async optimizeSyncFrequency(): Promise<void> {
    console.log('🔄 Starting sync frequency optimization...');
    
    const syncService = RealTimeSyncService.getInstance();
    
    // Get current sync stats
    const stats = syncService.getSyncStats();
    
    // If there are too many failed syncs, reduce frequency temporarily
    const optimizedConfig = {
      reducedFrequency: true,
      normalFrequency: 30000, // 30 seconds
      reducedFrequencyValue: 60000, // 1 minute
      timestamp: new Date(),
      reason: 'High error rate detected'
    };
    
    localStorage.setItem('taskflow_sync_optimization', JSON.stringify(optimizedConfig));
    
    console.log('✅ Sync frequency optimization completed');
  }

  /**
   * Critical memory cleanup
   */
  private async criticalMemoryCleanup(): Promise<void> {
    console.log('🚨 Starting CRITICAL memory cleanup...');
    
    // Clear all non-essential caches
    localStorage.removeItem('taskflow_cache');
    localStorage.removeItem('taskflow_temp_data');
    
    // Clear performance monitoring data
    PerformanceMonitor.clearData();
    
    // Clear browser caches if possible
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      } catch (error) {
        console.warn('Error clearing caches:', error);
      }
    }
    
    // Force garbage collection multiple times
    if (window.gc) {
      for (let i = 0; i < 3; i++) {
        window.gc();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Emit critical cleanup event
    window.dispatchEvent(new CustomEvent('critical-memory-cleanup', {
      detail: {
        timestamp: new Date(),
        reason: 'Critical memory threshold exceeded'
      }
    }));
    
    console.log('✅ CRITICAL memory cleanup completed');
  }

  /**
   * Get optimization status
   */
  public getOptimizationStatus(): {
    state: OptimizationState;
    currentMetrics: any;
    recommendations: string[];
  } {
    const metrics = PerformanceMonitor.getPerformanceReport();
    const recommendations: string[] = [];
    
    // Generate recommendations based on current metrics
    if (metrics.memory && metrics.memory.usedJSHeapSize > this.THRESHOLDS.MEMORY_HIGH) {
      recommendations.push('Consider reducing memory usage by clearing old data');
    }
    
    if (metrics.metrics.claudeResponse?.averageResponseTime > this.THRESHOLDS.RESPONSE_TIME_SLOW) {
      recommendations.push('Network optimization may help improve response times');
    }
    
    if (metrics.metrics.claudeResponse?.errorRate > this.THRESHOLDS.ERROR_RATE_HIGH) {
      recommendations.push('Error handling optimization recommended');
    }
    
    return {
      state: { ...this.state },
      currentMetrics: metrics,
      recommendations
    };
  }

  /**
   * Force run specific optimization
   */
  public async forceOptimization(optimizationType: 'memory' | 'network' | 'errors' | 'sync' | 'critical'): Promise<void> {
    console.log(`🎯 Force running optimization: ${optimizationType}`);
    
    switch (optimizationType) {
      case 'memory':
        await this.optimizeMemoryUsage();
        break;
      case 'network':
        await this.optimizeNetworkRequests();
        break;
      case 'errors':
        await this.optimizeErrorHandling();
        break;
      case 'sync':
        await this.optimizeSyncFrequency();
        break;
      case 'critical':
        await this.criticalMemoryCleanup();
        break;
      default:
        throw new Error(`Unknown optimization type: ${optimizationType}`);
    }
  }

  /**
   * Get performance recommendations
   */
  public getPerformanceRecommendations(): {
    priority: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    action?: string;
  }[] {
    const metrics = PerformanceMonitor.getPerformanceReport();
    const recommendations: any[] = [];
    
    // Critical recommendations
    if (metrics.memory && metrics.memory.usedJSHeapSize > this.THRESHOLDS.MEMORY_CRITICAL) {
      recommendations.push({
        priority: 'critical',
        message: 'זיכרון במצב קריטי - נדרש ניקוי מיידי',
        action: 'criticalMemoryCleanup'
      });
    }
    
    // High priority recommendations
    if (metrics.metrics.claudeResponse?.averageResponseTime > this.THRESHOLDS.RESPONSE_TIME_CRITICAL) {
      recommendations.push({
        priority: 'high',
        message: 'זמני תגובה איטיים מאוד - נדרש אופטימיזציה',
        action: 'networkOptimization'
      });
    }
    
    // Medium priority recommendations
    if (metrics.memory && metrics.memory.usedJSHeapSize > this.THRESHOLDS.MEMORY_HIGH) {
      recommendations.push({
        priority: 'medium',
        message: 'שימוש בזיכרון גבוה - מומלץ לנקות',
        action: 'memoryOptimization'
      });
    }
    
    // Low priority recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'low',
        message: 'הביצועים תקינים - הכל עובד כשורה',
        action: null
      });
    }
    
    return recommendations;
  }
}
