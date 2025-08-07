/**
 * TaskFlow - Production Safe Logger
 * Replaces console.log with secure logging that filters sensitive data
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  component?: string;
  data?: any;
}

class SecureLogger {
  private static instance: SecureLogger;
  private isProduction = process.env.NODE_ENV === 'production';
  private sensitiveKeywords = [
    'password', 'token', 'apikey', 'secret', 'auth', 'firebase',
    'user', 'email', 'phone', 'credit', 'card', 'ssn'
  ];

  public static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    if (typeof data === 'string') {
      return this.containsSensitiveData(data) ? '[REDACTED]' : data;
    }
    
    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.containsSensitiveData(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }

  private containsSensitiveData(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this.sensitiveKeywords.some(keyword => lowerText.includes(keyword));
  }

  private log(level: LogLevel, message: string, data?: any, component?: string): void {
    if (this.isProduction && level === 'debug') {
      return; // Don't log debug in production
    }

    const sanitizedData = this.sanitizeData(data);
    const sanitizedMessage = this.containsSensitiveData(message) ? '[REDACTED LOG MESSAGE]' : message;

    const logEntry: LogEntry = {
      level,
      message: sanitizedMessage,
      timestamp: new Date(),
      component,
      data: sanitizedData
    };

    // In production, consider sending to a logging service instead
    if (this.isProduction) {
      // For now, still use console but with sanitized data
      console[level](
        `[${logEntry.timestamp.toISOString()}] ${level.toUpperCase()}${component ? ` [${component}]` : ''}: ${sanitizedMessage}`,
        sanitizedData ? sanitizedData : ''
      );
    } else {
      // Development - show full data but still sanitize sensitive info
      console[level](
        `[${component || 'APP'}] ${sanitizedMessage}`,
        sanitizedData || ''
      );
    }
  }

  public debug(message: string, data?: any, component?: string): void {
    this.log('debug', message, data, component);
  }

  public info(message: string, data?: any, component?: string): void {
    this.log('info', message, data, component);
  }

  public warn(message: string, data?: any, component?: string): void {
    this.log('warn', message, data, component);
  }

  public error(message: string, data?: any, component?: string): void {
    this.log('error', message, data, component);
  }

  // Security-specific logging
  public security(message: string, data?: any, component?: string): void {
    this.log('warn', `🔒 SECURITY: ${message}`, data, component);
  }

  // Performance logging
  public performance(message: string, duration?: number, component?: string): void {
    this.log('info', `⚡ PERF: ${message}${duration ? ` (${duration}ms)` : ''}`, undefined, component);
  }
}

// Export singleton instance
export const logger = SecureLogger.getInstance();

// Convenience exports
export const logDebug = (message: string, data?: any, component?: string) => logger.debug(message, data, component);
export const logInfo = (message: string, data?: any, component?: string) => logger.info(message, data, component);
export const logWarn = (message: string, data?: any, component?: string) => logger.warn(message, data, component);
export const logError = (message: string, data?: any, component?: string) => logger.error(message, data, component);
export const logSecurity = (message: string, data?: any, component?: string) => logger.security(message, data, component);
export const logPerformance = (message: string, duration?: number, component?: string) => logger.performance(message, duration, component);

export default logger;