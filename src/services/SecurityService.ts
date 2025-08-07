/**
 * SecurityService - Production-grade security validation and protection
 * 
 * Features:
 * - Input validation and sanitization
 * - Rate limiting and abuse prevention
 * - XSS protection
 * - Data validation before Firestore operations
 * - Security headers and CSP
 * - Session management and token validation
 * 
 * Version: 2.1 with CSP headers - added Firebase domains
 */

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  blockDurationMs: number;  // How long to block after limit exceeded
}

export interface SecurityConfig {
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  enableRateLimit: boolean;
  maxMessageLength: number;
  maxTaskTitleLength: number;
  allowedImageTypes: string[];
  maxFileSize: number;
}

class SecurityServiceClass {
  private static instance: SecurityServiceClass;
  private config: SecurityConfig;
  private rateLimitCache: Map<string, { count: number; firstRequest: number; blockedUntil?: number }>;
  private csrfToken: string | null = null;

  private constructor() {
    this.config = {
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableRateLimit: true,
      maxMessageLength: 5000,
      maxTaskTitleLength: 200,
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxFileSize: 5 * 1024 * 1024 // 5MB
    };
    
    this.rateLimitCache = new Map();
    this.generateCSRFToken();
    this.setupSecurityHeaders();
    
    // Clean up rate limit cache every 5 minutes
    setInterval(() => this.cleanupRateLimit(), 5 * 60 * 1000);
  }

  public static getInstance(): SecurityServiceClass {
    if (!SecurityServiceClass.instance) {
      SecurityServiceClass.instance = new SecurityServiceClass();
    }
    return SecurityServiceClass.instance;
  }

  // 🛡️ XSS Protection
  public sanitizeHtml(input: string): string {
    if (!this.config.enableXSSProtection) return input;
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  public sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Remove potentially dangerous characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:text\/html/gi, '')
      .trim();
  }

  // 🔒 Rate Limiting
  public checkRateLimit(
    identifier: string, 
    config: RateLimitConfig = { windowMs: 60000, maxRequests: 30, blockDurationMs: 300000 }
  ): boolean {
    if (!this.config.enableRateLimit) return true;
    
    const now = Date.now();
    const record = this.rateLimitCache.get(identifier);
    
    // Check if currently blocked
    if (record?.blockedUntil && now < record.blockedUntil) {
      return false;
    }
    
    // Initialize or reset if window expired
    if (!record || (now - record.firstRequest) > config.windowMs) {
      this.rateLimitCache.set(identifier, {
        count: 1,
        firstRequest: now
      });
      return true;
    }
    
    // Increment count
    record.count++;
    
    // Check if limit exceeded
    if (record.count > config.maxRequests) {
      record.blockedUntil = now + config.blockDurationMs;
      console.warn(`Rate limit exceeded. Blocked until ${new Date(record.blockedUntil)}`);
      // 🔒 Security: Identifier not logged to prevent data exposure
      return false;
    }
    
    return true;
  }

  private cleanupRateLimit(): void {
    const now = Date.now();
    const entries = Array.from(this.rateLimitCache.entries());
    for (const [key, record] of entries) {
      if (record.blockedUntil && now > record.blockedUntil) {
        this.rateLimitCache.delete(key);
      }
    }
  }

  // 🔐 CSRF Protection
  private generateCSRFToken(): void {
    this.csrfToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  public getCSRFToken(): string {
    return this.csrfToken || '';
  }

  public validateCSRFToken(token: string): boolean {
    if (!this.config.enableCSRFProtection) return true;
    return token === this.csrfToken;
  }

  // 📝 Data Validation
  public validateTask(task: any): SecurityValidationResult {
    const errors: string[] = [];
    
    if (!task || typeof task !== 'object') {
      errors.push('Invalid task object');
      return { isValid: false, errors };
    }
    
    // Title validation
    if (!task.title || typeof task.title !== 'string') {
      errors.push('Task title is required and must be a string');
    } else if (task.title.length > this.config.maxTaskTitleLength) {
      errors.push(`Task title too long (max ${this.config.maxTaskTitleLength} characters)`);
    }
    
    // Completed validation
    if (typeof task.completed !== 'boolean') {
      errors.push('Task completed status must be a boolean');
    }
    
    // UserId validation
    if (!task.userId || typeof task.userId !== 'string') {
      errors.push('Task userId is required and must be a string');
    }
    
    // Dates validation
    if (task.createdAt && !(task.createdAt instanceof Date)) {
      errors.push('Task createdAt must be a Date object');
    }
    
    if (task.updatedAt && !(task.updatedAt instanceof Date)) {
      errors.push('Task updatedAt must be a Date object');
    }
    
    // Optional fields validation
    if (task.priority && !['low', 'medium', 'high', 'urgent'].includes(task.priority)) {
      errors.push('Task priority must be one of: low, medium, high, urgent');
    }
    
    if (task.estimatedTime && (typeof task.estimatedTime !== 'number' || task.estimatedTime < 0)) {
      errors.push('Task estimatedTime must be a positive number');
    }
    
    // Sanitize data
    const sanitizedData = {
      ...task,
      title: this.sanitizeInput(task.title),
      description: task.description ? this.sanitizeInput(task.description) : undefined,
      category: task.category ? this.sanitizeInput(task.category) : undefined
    };
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  public validateChatMessage(message: any): SecurityValidationResult {
    const errors: string[] = [];
    
    if (!message || typeof message !== 'object') {
      errors.push('Invalid message object');
      return { isValid: false, errors };
    }
    
    // Content validation
    if (!message.content || typeof message.content !== 'string') {
      errors.push('Message content is required and must be a string');
    } else if (message.content.length > this.config.maxMessageLength) {
      errors.push(`Message too long (max ${this.config.maxMessageLength} characters)`);
    }
    
    // Sender validation
    if (!message.sender || !['user', 'ai', 'assistant', 'system'].includes(message.sender)) {
      errors.push('Message sender must be one of: user, ai, assistant, system');
    }
    
    // Timestamp validation
    if (!message.timestamp || !(message.timestamp instanceof Date)) {
      errors.push('Message timestamp is required and must be a Date object');
    }
    
    // Type validation
    if (message.type && !['text', 'task', 'suggestion', 'error', 'system'].includes(message.type)) {
      errors.push('Message type must be one of: text, task, suggestion, error, system');
    }
    
    // Sanitize data
    const sanitizedData = {
      ...message,
      content: this.sanitizeInput(message.content),
      session_id: message.session_id ? this.sanitizeInput(message.session_id) : undefined
    };
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  public validateChatSession(session: any): SecurityValidationResult {
    const errors: string[] = [];
    
    if (!session || typeof session !== 'object') {
      errors.push('Invalid session object');
      return { isValid: false, errors };
    }
    
    // Title validation
    if (!session.title || typeof session.title !== 'string') {
      errors.push('Session title is required and must be a string');
    } else if (session.title.length > 100) {
      errors.push('Session title too long (max 100 characters)');
    }
    
    // Status validation
    if (!session.status || !['active', 'archived', 'deleted'].includes(session.status)) {
      errors.push('Session status must be one of: active, archived, deleted');
    }
    
    // Dates validation
    if (!session.created_at || !(session.created_at instanceof Date)) {
      errors.push('Session created_at is required and must be a Date object');
    }
    
    if (!session.updated_at || !(session.updated_at instanceof Date)) {
      errors.push('Session updated_at is required and must be a Date object');
    }
    
    // Message count validation
    if (typeof session.message_count !== 'number' || session.message_count < 0) {
      errors.push('Session message_count must be a non-negative number');
    }
    
    // Sanitize data
    const sanitizedData = {
      ...session,
      title: this.sanitizeInput(session.title)
    };
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  // 🔒 Security Headers Setup
  private setupSecurityHeaders(): void {
    if (typeof document !== 'undefined') {
      // Remove existing CSP if any
      const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (existingCSP) {
        existingCSP.remove();
      }
      
      // 🚦 Check environment using new env variables
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           process.env.REACT_APP_IS_DEV_MODE === 'true' ||
                           window.location.hostname === 'localhost';
      
      const cspEnabled = process.env.REACT_APP_CSP_ENABLED !== 'false';
      
      console.log('🛡️ Security Service CSP Config:', { 
        NODE_ENV: process.env.NODE_ENV,
        IS_DEV_MODE: process.env.REACT_APP_IS_DEV_MODE,
        CSP_ENABLED: process.env.REACT_APP_CSP_ENABLED,
        isDevelopment, 
        cspEnabled 
      });
      
      if (isDevelopment || !cspEnabled) {
        // Relaxed CSP for development or when explicitly disabled
        const cspMeta = document.createElement('meta');
        cspMeta.httpEquiv = 'Content-Security-Policy';
        cspMeta.content = [
          "default-src 'self' http://localhost:4000 http://127.0.0.1:4000 'unsafe-inline' 'unsafe-eval' data: blob:",
          "connect-src 'self' http://localhost:4000 http://127.0.0.1:4000 ws://localhost:3000 wss://localhost:3000",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:4000",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: blob: https:",
          "font-src 'self' https://fonts.gstatic.com",
          "frame-src 'self'"
        ].join('; ');
        document.head.appendChild(cspMeta);
        console.log('🔓 CSP relaxed for development mode');
      } else {
        // Strict CSP for production
        const cspMeta = document.createElement('meta');
        cspMeta.httpEquiv = 'Content-Security-Policy';
        cspMeta.content = "default-src 'self'; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://oauth2.googleapis.com https://www.googleapis.com https://apis.google.com https://www.gstatic.com https://firestore.googleapis.com https://api.anthropic.com https://accounts.google.com https://*.firebaseapp.com; frame-src 'self' https://accounts.google.com https://*.firebaseapp.com; script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com";
        document.head.appendChild(cspMeta);
        console.log('🔒 CSP enabled for production mode');
      }
    }
  }

  // 🛡️ Auth Token Validation
  public validateAuthToken(token: string): boolean {
    if (!token) return false;
    
    try {
      // Basic JWT structure validation
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Decode payload (without verification - Firebase handles that)
      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // 🔐 File Upload Security
  public validateFileUpload(file: File): SecurityValidationResult {
    const errors: string[] = [];
    
    // File size check
    if (file.size > this.config.maxFileSize) {
      errors.push(`File too large (max ${this.config.maxFileSize / 1024 / 1024}MB)`);
    }
    
    // File type check
    if (!this.config.allowedImageTypes.includes(file.type)) {
      errors.push(`File type not allowed. Allowed types: ${this.config.allowedImageTypes.join(', ')}`);
    }
    
    // File name sanitization
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? { ...file, name: sanitizedName } : undefined
    };
  }

  // 🔧 Security Configuration
  public updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // 📊 Security Metrics
  public getSecurityMetrics(): {
    rateLimitHits: number;
    blockedRequests: number;
    validationErrors: number;
  } {
    const now = Date.now();
    let blockedRequests = 0;
    
    const records = Array.from(this.rateLimitCache.values());
    for (const record of records) {
      if (record.blockedUntil && now < record.blockedUntil) {
        blockedRequests++;
      }
    }
    
    return {
      rateLimitHits: this.rateLimitCache.size,
      blockedRequests,
      validationErrors: 0 // This would be tracked separately in a real implementation
    };
  }
}

export const SecurityService = SecurityServiceClass.getInstance();
export default SecurityService;
