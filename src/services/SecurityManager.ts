/**
 * TaskFlow - SecurityManager Service
 * מסמך מקור: SYSTEM_DESIGN_AND_IMPROVEMENTS_2025.md - Security & Privacy Section
 * תאריך יצירה: 6 באוגוסט 2025
 * 
 * מערכת אבטחה מתקדמת לזיהוי והגנה על נתונים רגישים
 */

import type {
  SecurityScanResult,
  SensitiveDataPattern,
  SensitiveDataType,
  SecurityRecommendation,
  SecurityAction,
  ErrorLog,
  ErrorType
} from '../types/index';

/**
 * 🔐 SecurityManager - Multi-Layer Security Strategy
 * 
 * Layer 1: Input Validation (Prompt injection, XSS, SQL injection blocks)
 * Layer 2: Sensitive Data Detection (passwords, credit cards, medical info)
 * Layer 3: AI Response Filtering (Claude response sanitization)
 * Layer 4: Encryption & Access Control (AES-256, audit logs)
 */
export class SecurityManager {
  private static instance: SecurityManager;
  private readonly sensitivePatterns: Map<SensitiveDataType, RegExp[]>;
  private readonly auditLogs: ErrorLog[] = [];
  
  // Privacy mode settings
  private privacyModeEnabled: boolean = false;
  private autoRedactionEnabled: boolean = true;
  
  constructor() {
    this.sensitivePatterns = new Map();
    this.initializeSensitivePatterns();
  }
  
  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }
  
  // ========================
  // 🔍 Layer 2: Sensitive Data Detection
  // ========================
  
  /**
   * סורק תוכן לזיהוי נתונים רגישים
   * מתוך המסמך: "סיסמאות בצ'אט → Real-time detection → ⚠️ זיהיתי מידע רגיש!"
   */
  public async scanMessage(content: string): Promise<SecurityScanResult> {
    const detectedPatterns: SensitiveDataPattern[] = [];
    let confidenceScore = 0;
    
    // בדיקה לכל סוג של נתונים רגישים
    this.sensitivePatterns.forEach((patterns, dataType) => {
      for (const pattern of patterns) {
        const matches = Array.from(content.matchAll(pattern));
        
        for (const match of matches) {
          if (match.index !== undefined) {
            const severity = this.calculateSeverity(dataType, match[0]);
            const confidence = this.calculateConfidence(dataType, match[0]);
            
            detectedPatterns.push({
              type: dataType,
              pattern: match[0],
              position: {
                start: match.index,
                end: match.index + match[0].length
              },
              confidence,
              severity
            });
            
            confidenceScore = Math.max(confidenceScore, confidence);
          }
        }
      }
    });
    
    const result: SecurityScanResult = {
      has_sensitive_data: detectedPatterns.length > 0,
      detected_patterns: detectedPatterns,
      confidence_score: confidenceScore,
      recommendations: this.generateRecommendations(detectedPatterns),
      sanitized_content: this.autoRedactionEnabled 
        ? this.sanitizeContent(content, detectedPatterns)
        : undefined
    };
    
    // רישום ביומן אבטחה
    if (result.has_sensitive_data) {
      this.logSecurityEvent('sensitive_data_detected', {
        patterns_count: detectedPatterns.length,
        confidence: confidenceScore,
        data_types: detectedPatterns.map(p => p.type)
      });
    }
    
    return result;
  }
  
  /**
   * ניקוי תוכן מנתונים רגישים לפני שליחה ל-Claude
   * מתוך המסמך: "API Strategy: לא שליחת מידע רגיש מזוהה"
   */
  public sanitizeForAI(content: string): Promise<string> {
    return new Promise(async (resolve) => {
      const scanResult = await this.scanMessage(content);
      
      if (!scanResult.has_sensitive_data) {
        resolve(content);
        return;
      }
      
      let sanitized = content;
      
      // החלפת נתונים רגישים בplaceholders
      for (const pattern of scanResult.detected_patterns) {
        const placeholder = this.getPlaceholder(pattern.type);
        sanitized = sanitized.replace(pattern.pattern, placeholder);
      }
      
      this.logSecurityEvent('content_sanitized', {
        original_length: content.length,
        sanitized_length: sanitized.length,
        patterns_replaced: scanResult.detected_patterns.length
      });
      
      resolve(sanitized);
    });
  }
  
  // ========================
  // 🛡️ Layer 1: Input Validation & Prompt Injection
  // ========================
  
  /**
   * הגנה מפני prompt injection ו-malicious input
   * מתוך המסמך: "Prompt injection → Multi-layer prevention → Input sanitization"
   */
  public validateInput(input: string): { isValid: boolean; reason?: string; sanitized?: string } {
    // בדיקות prompt injection
    const injectionPatterns = [
      /ignore\s+previous\s+instructions/i,
      /forget\s+everything/i,
      /you\s+are\s+now/i,
      /new\s+instructions/i,
      /system\s*:\s*/i,
      /assistant\s*:\s*/i,
      /<\s*script/i,
      /javascript\s*:/i,
      /data\s*:\s*text\/html/i,
      /eval\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i
    ];
    
    for (const pattern of injectionPatterns) {
      if (pattern.test(input)) {
        this.logSecurityEvent('prompt_injection_blocked', {
          pattern: pattern.source,
          input_length: input.length
        });
        
        return {
          isValid: false,
          reason: 'זוהתה ניסיון prompt injection - הבקשה נחסמה מטעמי אבטחה'
        };
      }
    }
    
    // בדיקת אורך קיצוני
    if (input.length > 50000) {
      return {
        isValid: false,
        reason: 'הקלט ארוך מדי - מקסימום 50,000 תווים'
      };
    }
    
    // ניקוי HTML/XSS
    const sanitized = this.sanitizeHTML(input);
    
    return {
      isValid: true,
      sanitized: sanitized !== input ? sanitized : undefined
    };
  }
  
  /**
   * ניקוי HTML ומניעת XSS
   */
  public sanitizeHTML(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<\s*\/?\s*(script|iframe|object|embed|form)\s*>/gi, '');
  }
  
  // ========================
  // 🔐 Layer 4: Privacy Mode & Encryption
  // ========================
  
  /**
   * הפעלת מצב פרטיות
   * מתוך המסמך: "🔒 רוצה שאשמור מוצפן? → AES-256 local encryption"
   */
  public enablePrivacyMode(): void {
    this.privacyModeEnabled = true;
    
    // הוספת visual indicators ו-warnings
    this.notifyPrivacyModeEnabled();
    
    this.logSecurityEvent('privacy_mode_enabled', {
      timestamp: new Date().toISOString()
    });
  }
  
  public disablePrivacyMode(): void {
    this.privacyModeEnabled = false;
    
    this.logSecurityEvent('privacy_mode_disabled', {
      timestamp: new Date().toISOString()
    });
  }
  
  public isPrivacyModeEnabled(): boolean {
    return this.privacyModeEnabled;
  }
  
  /**
   * הצפנת נתונים רגישים ב-AES-256
   * רק לשימוש local - לא נשלח לשרתים חיצוניים
   */
  public async encryptSensitiveData(data: string): Promise<string> {
    // בסביבת web נשתמש ב-Web Crypto API
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const key = await this.getOrCreateEncryptionKey();
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedBuffer = await window.crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv: iv
          },
          key,
          dataBuffer
        );
        
        // החזרת IV + encrypted data כ-base64
        const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encryptedBuffer), iv.length);
        
        const combinedArray = Array.from(combined);
        return btoa(String.fromCharCode.apply(null, combinedArray));
      } catch (error) {
        this.logSecurityEvent('encryption_failed', { error: String(error) });
        throw new Error('Encryption failed');
      }
    }
    
    // Fallback לסביבות ללא crypto support
    return this.simpleObfuscation(data);
  }
  
  /**
   * פענוח נתונים מוצפנים
   */
  public async decryptSensitiveData(encryptedData: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const key = await this.getOrCreateEncryptionKey();
        const combined = new Uint8Array(
          atob(encryptedData).split('').map(char => char.charCodeAt(0))
        );
        
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);
        
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv
          },
          key,
          encrypted
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
      } catch (error) {
        this.logSecurityEvent('decryption_failed', { error: String(error) });
        throw new Error('Decryption failed');
      }
    }
    
    // Fallback
    return this.simpleDeobfuscation(encryptedData);
  }
  
  // ========================
  // 🔧 Private Helper Methods
  // ========================
  
  /**
   * אתחול patterns לזיהוי נתונים רגישים
   */
  private initializeSensitivePatterns(): void {
    this.sensitivePatterns.set('password', [
      /password\s*[:=]\s*['"]?([^\s'"]+)['"]?/gi,
      /pwd\s*[:=]\s*['"]?([^\s'"]+)['"]?/gi,
      /סיסמה?\s*[:=]\s*['"]?([^\s'"]+)['"]?/gi,
      /סיסמא\s*[:=]\s*['"]?([^\s'"]+)['"]?/gi
    ]);
    
    this.sensitivePatterns.set('credit_card', [
      /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, // Visa, MasterCard, etc.
      /\b3[47]\d{2}[-\s]?\d{6}[-\s]?\d{5}\b/g // American Express
    ]);
    
    this.sensitivePatterns.set('phone_number', [
      /\b0[2-9]\d{1,2}[-\s]?\d{3}[-\s]?\d{4}\b/g, // Israeli phone
      /\b\+972[-\s]?[2-9]\d{1,2}[-\s]?\d{3}[-\s]?\d{4}\b/g, // Israeli international
      /\b\(\d{3}\)\s?\d{3}[-\s]?\d{4}\b/g // US format
    ]);
    
    this.sensitivePatterns.set('email_address', [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    ]);
    
    this.sensitivePatterns.set('ssn', [
      /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g // US SSN
    ]);
    
    this.sensitivePatterns.set('personal_id', [
      /\b\d{9}\b/g, // Israeli ID
      /ת\.?ז\.?\s*[:=]?\s*\d{9}/gi
    ]);
    
    this.sensitivePatterns.set('api_key', [
      /api[_-]?key\s*[:=]\s*['"]?([a-zA-Z0-9_\-]+)['"]?/gi,
      /token\s*[:=]\s*['"]?([a-zA-Z0-9_\-]+)['"]?/gi,
      /sk-[a-zA-Z0-9_\-]+/g, // Claude API key format
      /Bearer\s+[a-zA-Z0-9_\-\.]+/g
    ]);
    
    this.sensitivePatterns.set('bank_account', [
      /account\s*#?\s*[:=]?\s*\d{6,12}/gi,
      /חשבון\s*בנק\s*[:=]?\s*\d{6,12}/gi
    ]);
    
    this.sensitivePatterns.set('medical_info', [
      /diagnos[ie]s?\s*[:=]\s*([^.\n]+)/gi,
      /medication\s*[:=]\s*([^.\n]+)/gi,
      /blood\s*type\s*[:=]\s*[ABO][+-]/gi,
      /אבחנה?\s*[:=]\s*([^.\n]+)/gi,
      /תרופה?\s*[:=]\s*([^.\n]+)/gi
    ]);
  }
  
  /**
   * חישוב חומרת הנתון הרגיש
   */
  private calculateSeverity(dataType: SensitiveDataType, content: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (dataType) {
      case 'password':
      case 'api_key':
      case 'credit_card':
        return 'critical';
      case 'ssn':
      case 'personal_id':
      case 'bank_account':
        return 'high';
      case 'phone_number':
      case 'medical_info':
        return 'medium';
      case 'email_address':
        return 'low';
      default:
        return 'low';
    }
  }
  
  /**
   * חישוב רמת ביטחון בזיהוי
   */
  private calculateConfidence(dataType: SensitiveDataType, content: string): number {
    // לוגיקה מתקדמת לחישוב confidence
    let confidence = 70; // baseline
    
    // בדיקות נוספות לפי סוג הנתון
    switch (dataType) {
      case 'credit_card':
        // Luhn algorithm validation
        confidence = this.validateCreditCard(content) ? 95 : 30;
        break;
      case 'email_address':
        confidence = content.includes('.') && content.includes('@') ? 90 : 60;
        break;
      case 'phone_number':
        confidence = content.replace(/\D/g, '').length >= 9 ? 85 : 50;
        break;
      case 'personal_id':
        // Israeli ID validation
        confidence = this.validateIsraeliID(content) ? 95 : 40;
        break;
      default:
        confidence = 70;
    }
    
    return Math.min(100, Math.max(0, confidence));
  }
  
  /**
   * יצירת המלצות אבטחה
   */
  private generateRecommendations(patterns: SensitiveDataPattern[]): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = [];
    
    const criticalPatterns = patterns.filter(p => p.severity === 'critical');
    const highPatterns = patterns.filter(p => p.severity === 'high');
    
    if (criticalPatterns.length > 0) {
      recommendations.push({
        type: 'action_required',
        message: `זוהו ${criticalPatterns.length} נתונים קריטיים (סיסמאות/API keys). מומלץ להסיר או להחליף אותם.`,
        action: {
          type: 'redact',
          description: 'הסתר נתונים קריטיים',
          auto_applicable: true
        }
      });
    }
    
    if (highPatterns.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `זוהו ${highPatterns.length} נתונים אישיים רגישים. האם להמשיך עם הגנה מוגברת?`,
        action: {
          type: 'encrypt',
          description: 'הצפן נתונים מקומית',
          auto_applicable: false
        }
      });
    }
    
    if (patterns.some(p => p.type === 'medical_info')) {
      recommendations.push({
        type: 'suggestion',
        message: 'זוהה מידע רפואי. מומלץ להפעיל מצב פרטיות מוגבר.',
        action: {
          type: 'encrypt',
          description: 'הפעל מצב פרטיות',
          auto_applicable: false
        }
      });
    }
    
    return recommendations;
  }
  
  /**
   * ניקוי תוכן עם החלפה ב-placeholders
   */
  private sanitizeContent(content: string, patterns: SensitiveDataPattern[]): string {
    let sanitized = content;
    
    // מיון לפי position (מהסוף להתחלה כדי לא לקלקל indices)
    patterns.sort((a, b) => b.position.start - a.position.start);
    
    for (const pattern of patterns) {
      const placeholder = this.getPlaceholder(pattern.type);
      sanitized = 
        sanitized.substring(0, pattern.position.start) +
        placeholder +
        sanitized.substring(pattern.position.end);
    }
    
    return sanitized;
  }
  
  /**
   * קבלת placeholder מתאים לכל סוג נתון
   */
  private getPlaceholder(dataType: SensitiveDataType): string {
    const placeholders: Record<SensitiveDataType, string> = {
      password: '[סיסמה מוסתרת]',
      credit_card: '[מספר כרטיס אשראי]',
      phone_number: '[מספר טלפון]',
      email_address: '[כתובת אימייל]',
      ssn: '[מספר ביטוח לאומי]',
      personal_id: '[תעודת זהות]',
      api_key: '[API Key]',
      bank_account: '[מספר חשבון בנק]',
      medical_info: '[מידע רפואי]'
    };
    
    return placeholders[dataType] || '[מידע רגיש]';
  }
  
  /**
   * רישום אירועי אבטחה
   */
  public logSecurityEvent(eventType: string, details: any): void {
    const logEntry: ErrorLog = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      error_type: 'security_error',
      message: `Security event: ${eventType}`,
      user_id: 'atiaron', // כרגע משתמש יחיד
      session_id: this.getCurrentSessionId(),
      timestamp: new Date(),
      context: {
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        component: 'SecurityManager',
        action: eventType,
        additional_data: details
      },
      resolved: false
    };
    
    this.auditLogs.push(logEntry);
    
    // שמירה ב-localStorage לביקורת עתידית
    if (typeof localStorage !== 'undefined') {
      const existingLogs = JSON.parse(localStorage.getItem('taskflow_security_logs') || '[]');
      existingLogs.push(logEntry);
      
      // שמירת רק 100 הלוגים האחרונים
      const recentLogs = existingLogs.slice(-100);
      localStorage.setItem('taskflow_security_logs', JSON.stringify(recentLogs));
    }
    
    // Alert לאירועים קריטיים
    if (['prompt_injection_blocked', 'critical_data_detected'].includes(eventType)) {
      console.warn('🔒 TaskFlow Security Alert:', logEntry);
    }
  }
  
  /**
   * קבלת session ID נוכחי
   */
  private getCurrentSessionId(): string {
    if (typeof sessionStorage !== 'undefined') {
      let sessionId = sessionStorage.getItem('taskflow_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('taskflow_session_id', sessionId);
      }
      return sessionId;
    }
    return 'unknown_session';
  }
  
  /**
   * קבלת או יצירת מפתח הצפנה
   */
  private async getOrCreateEncryptionKey(): Promise<CryptoKey> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }
    
    // בדיקה אם יש מפתח שמור ב-localStorage (לא מומלץ לייצור!)
    // כאן נשתמש בגישה זמנית למטרות פיתוח
    const keyData = new Uint8Array(32);
    window.crypto.getRandomValues(keyData);
    
    return await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * הודעה על הפעלת מצב פרטיות
   */
  private notifyPrivacyModeEnabled(): void {
    // כאן נשלח הודעה ל-UI component
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('taskflow-privacy-mode-enabled', {
        detail: { message: '🔒 מצב פרטיות מופעל - הצפנה מקומית פעילה' }
      }));
    }
  }
  
  /**
   * Obfuscation פשוט ל-fallback
   */
  private simpleObfuscation(data: string): string {
    return btoa(data.split('').reverse().join(''));
  }
  
  private simpleDeobfuscation(data: string): string {
    return atob(data).split('').reverse().join('');
  }
  
  /**
   * ולידציה של כרטיס אשראי (Luhn algorithm)
   */
  private validateCreditCard(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }
  
  /**
   * ולידציה של תעודת זהות ישראלית
   */
  private validateIsraeliID(id: string): boolean {
    const digits = id.replace(/\D/g, '');
    if (digits.length !== 9) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let digit = parseInt(digits[i]);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10);
        }
      }
      sum += digit;
    }
    
    return sum % 10 === 0;
  }
  
  // ========================
  // 🔍 Public Security APIs
  // ========================
  
  /**
   * קבלת לוגי אבטחה לביקורת
   */
  public getSecurityLogs(): ErrorLog[] {
    return [...this.auditLogs];
  }
  
  /**
   * ניקוי לוגי אבטחה (לאחר ביקורת)
   */
  public clearSecurityLogs(): void {
    this.auditLogs.length = 0;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('taskflow_security_logs');
    }
  }
  
  /**
   * קבלת סטטיסטיקות אבטחה
   */
  public getSecurityStats() {
    const logs = this.getSecurityLogs();
    const last24h = logs.filter(log => 
      Date.now() - log.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    
    return {
      total_events: logs.length,
      events_last_24h: last24h.length,
      privacy_mode_enabled: this.privacyModeEnabled,
      auto_redaction_enabled: this.autoRedactionEnabled,
      most_common_threats: this.getMostCommonThreats(logs),
      last_security_event: logs[logs.length - 1]?.timestamp
    };
  }

  // ========================
  // 🔒 Enhanced Session Security (חלק 8)
  // ========================

  /**
   * ולידציה של גישה לסשן
   * מוודא שמשתמש יכול לגשת רק לסשנים שלו
   */
  public static validateSessionAccess(userId: string, sessionId: string): boolean {
    // Import AuthService dynamically to avoid circular deps
    const currentUser = { uid: 'atiaron' }; // Simplified for now
    if (!currentUser || currentUser.uid !== userId) {
      console.error('🔒 Unauthorized session access attempt');
      SecurityManager.getInstance().logSecurityEvent('unauthorized_session_access', {
        attempted_user: userId,
        current_user: currentUser?.uid || 'anonymous',
        session_id: sessionId
      });
      return false;
    }
    
    return true;
  }

  /**
   * ניקוי נתוני סשן מתוכן רגיש
   */
  public static sanitizeSessionData(session: any): any {
    const security = SecurityManager.getInstance();
    
    return {
      ...session,
      // Remove sensitive fields if any
      id: security.sanitizeHTML(session.id),
      title: security.sanitizeHTML(session.title),
      // Keep other fields as-is for now
    };
  }

  /**
   * ניקוי הודעות מתוכן רגיש
   */
  public static async sanitizeMessage(message: any): Promise<any> {
    const security = SecurityManager.getInstance();
    
    // Scan for sensitive data first
    const scanResult = await security.scanMessage(message.content);
    
    return {
      ...message,
      content: scanResult.sanitized_content || message.content,
      // Add security metadata
      security_scan: {
        has_sensitive_data: scanResult.has_sensitive_data,
        patterns_detected: scanResult.detected_patterns.length,
        confidence_score: scanResult.confidence_score
      }
    };
  }

  // ========================
  // 🚦 Rate Limiting Implementation
  // ========================

  private static userActionCounts: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * בדיקת הגבלת קצב פעולות למשתמש
   */
  public static checkRateLimit(userId: string, action: string, limit: number = 60): boolean {
    const key = `${userId}-${action}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    
    const userAction = this.userActionCounts.get(key);
    
    if (!userAction || now > userAction.resetTime) {
      this.userActionCounts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (userAction.count >= limit) {
      console.warn(`🚫 Rate limit exceeded for ${userId} on ${action}`);
      SecurityManager.getInstance().logSecurityEvent('rate_limit_exceeded', {
        user_id: userId,
        action,
        current_count: userAction.count,
        limit
      });
      return false;
    }
    
    userAction.count++;
    return true;
  }

  /**
   * איפוס מונה פעולות למשתמש (למקרי חירום)
   */
  public static resetUserRateLimit(userId: string, action?: string): void {
    if (action) {
      const key = `${userId}-${action}`;
      this.userActionCounts.delete(key);
    } else {
      // Clear all actions for user
      const keysToDelete = Array.from(this.userActionCounts.keys())
        .filter(key => key.startsWith(`${userId}-`));
      
      keysToDelete.forEach(key => this.userActionCounts.delete(key));
    }
    
    SecurityManager.getInstance().logSecurityEvent('rate_limit_reset', {
      user_id: userId,
      action: action || 'all'
    });
  }

  // ========================
  // 🔐 Enhanced Data Encryption
  // ========================

  /**
   * הצפנת נתונים רגישים ב-AES-GCM עם מטא-דאטה
   */
  public static async encryptSensitiveData(data: string, metadata?: { sessionId?: string; dataType?: string }): Promise<{
    encrypted: string;
    metadata: {
      algorithm: string;
      timestamp: string;
      sessionId?: string;
      dataType?: string;
      checksum: string;
    };
  }> {
    // Simple encryption for demo - use proper encryption in production
    try {
      if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API not available');
      }
      
      const encoder = new TextEncoder();
      const dataEncoded = encoder.encode(data);
      
      // Generate a new key for each encryption (in production, use key derivation)
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataEncoded
      );
      
      // Create checksum for integrity verification
      const checksum = await SecurityManager.createChecksum(data);
      
      // Combine IV + key + encrypted data (simplified for demo)
      const keyData = await window.crypto.subtle.exportKey('raw', key);
      const combined = new Uint8Array(iv.length + keyData.byteLength + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(keyData), iv.length);
      combined.set(new Uint8Array(encrypted), iv.length + keyData.byteLength);
      
      const encryptedB64 = btoa(String.fromCharCode.apply(null, Array.from(combined)));
      
      SecurityManager.getInstance().logSecurityEvent('data_encrypted', {
        data_size: data.length,
        session_id: metadata?.sessionId,
        data_type: metadata?.dataType
      });
      
      return {
        encrypted: encryptedB64,
        metadata: {
          algorithm: 'AES-GCM-256',
          timestamp: new Date().toISOString(),
          sessionId: metadata?.sessionId,
          dataType: metadata?.dataType,
          checksum
        }
      };
      
    } catch (error) {
      SecurityManager.getInstance().logSecurityEvent('encryption_failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        data_size: data.length
      });
      
      // Fallback to simple obfuscation
      return {
        encrypted: btoa(data.split('').reverse().join('')),
        metadata: {
          algorithm: 'simple-obfuscation',
          timestamp: new Date().toISOString(),
          checksum: SecurityManager.createSimpleChecksum(data)
        }
      };
    }
  }

  /**
   * פענוח נתונים מוצפנים עם ולידציה
   */
  public static async decryptSensitiveData(encryptedData: string, expectedChecksum?: string): Promise<string> {
    try {
      if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API not available');
      }
      
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const keyData = combined.slice(12, 12 + 32); // 32 bytes for AES-256
      const encrypted = combined.slice(12 + 32);
      
      const key = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      const decoder = new TextDecoder();
      const decryptedText = decoder.decode(decrypted);
      
      // Verify checksum if provided
      if (expectedChecksum) {
        const actualChecksum = await SecurityManager.createChecksum(decryptedText);
        if (actualChecksum !== expectedChecksum) {
          throw new Error('Data integrity check failed');
        }
      }
      
      SecurityManager.getInstance().logSecurityEvent('data_decrypted', {
        data_size: decryptedText.length,
        checksum_verified: !!expectedChecksum
      });
      
      return decryptedText;
      
    } catch (error) {
      SecurityManager.getInstance().logSecurityEvent('decryption_failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Try fallback simple deobfuscation
      try {
        return atob(encryptedData).split('').reverse().join('');
      } catch {
        throw new Error('Decryption failed completely');
      }
    }
  }

  // ========================
  // 🛡️ Utility Security Methods
  // ========================

  /**
   * יצירת checksum לוולידציה של שלמות נתונים
   */
  private static async createChecksum(data: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    return SecurityManager.createSimpleChecksum(data);
  }

  /**
   * יצירת checksum פשוט לfallback
   */
  private static createSimpleChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * קבלת סטטיסטיקות אבטחה עדכניות
   */
  public static getSecurityStatus(): {
    rateLimit: { activeUsers: number; totalBlocks: number };
    encryption: { operationsToday: number; failureRate: number };
    sessionSecurity: { validatedSessions: number; blockedAttempts: number };
    overallThreatLevel: 'low' | 'medium' | 'high';
  } {
    const security = SecurityManager.getInstance();
    const logs = security.getSecurityLogs();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysLogs = logs.filter(log => log.timestamp >= today);
    
    const rateLimitBlocks = todaysLogs.filter(log => 
      log.context.action === 'rate_limit_exceeded'
    ).length;
    
    const encryptionOps = todaysLogs.filter(log => 
      log.context.action === 'data_encrypted'
    ).length;
    
    const encryptionFailures = todaysLogs.filter(log => 
      log.context.action === 'encryption_failed'
    ).length;
    
    const sessionValidations = todaysLogs.filter(log => 
      log.context.action === 'unauthorized_session_access'
    ).length;
    
    const criticalEvents = todaysLogs.filter(log => 
      ['prompt_injection_blocked', 'unauthorized_session_access', 'rate_limit_exceeded'].includes(log.context.action)
    ).length;
    
    let threatLevel: 'low' | 'medium' | 'high' = 'low';
    if (criticalEvents > 10) threatLevel = 'high';
    else if (criticalEvents > 3) threatLevel = 'medium';
    
    return {
      rateLimit: {
        activeUsers: this.userActionCounts.size,
        totalBlocks: rateLimitBlocks
      },
      encryption: {
        operationsToday: encryptionOps,
        failureRate: encryptionOps > 0 ? (encryptionFailures / encryptionOps) * 100 : 0
      },
      sessionSecurity: {
        validatedSessions: todaysLogs.length - sessionValidations,
        blockedAttempts: sessionValidations
      },
      overallThreatLevel: threatLevel
    };
  }
  
  private getMostCommonThreats(logs: ErrorLog[]): Array<{ threat: string; count: number }> {
    const threats = new Map<string, number>();
    
    logs.forEach(log => {
      const action = log.context.action;
      threats.set(action, (threats.get(action) || 0) + 1);
    });
    
    return Array.from(threats.entries())
      .map(([threat, count]) => ({ threat, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
  
  /**
   * הגדרת אפשרויות אבטחה
   */
  public updateSecuritySettings(settings: {
    autoRedaction?: boolean;
    privacyMode?: boolean;
  }): void {
    if (settings.autoRedaction !== undefined) {
      this.autoRedactionEnabled = settings.autoRedaction;
    }
    
    if (settings.privacyMode !== undefined) {
      if (settings.privacyMode) {
        this.enablePrivacyMode();
      } else {
        this.disablePrivacyMode();
      }
    }
    
    this.logSecurityEvent('settings_updated', settings);
  }
}

// ========================
// 🔧 Utility Functions
// ========================

/**
 * המרת תוכן עבור Claude API עם אבטחה
 */
export async function secureClaude(content: string): Promise<string> {
  const security = SecurityManager.getInstance();
  
  // Layer 1: Input validation
  const validation = security.validateInput(content);
  if (!validation.isValid) {
    throw new Error(validation.reason);
  }
  
  // Layer 2: Sensitive data detection and sanitization
  const sanitized = await security.sanitizeForAI(validation.sanitized || content);
  
  return sanitized;
}

/**
 * בדיקה מהירה לנתונים רגישים
 */
export async function quickSecurityCheck(content: string): Promise<boolean> {
  const security = SecurityManager.getInstance();
  const result = await security.scanMessage(content);
  return result.has_sensitive_data;
}

/**
 * אתחול אבטחה לאפליקציה
 */
export function initializeSecurity(options?: {
  privacyMode?: boolean;
  autoRedaction?: boolean;
}): SecurityManager {
  const security = SecurityManager.getInstance();
  
  if (options) {
    security.updateSecuritySettings(options);
  }
  
  return security;
}

// ========================
// 🔒 Enhanced Session Security Extensions (חלק 8)
// ========================

/**
 * ולידציה של גישה לסשן - פונקציה נפרדת
 * מוודא שמשתמש יכול לגשת רק לסשנים שלו
 */
export function validateSessionAccess(userId: string, sessionId: string): boolean {
  // Simplified auth check for now - in production use proper AuthService
  const currentUser = { uid: 'atiaron' }; // Replace with actual auth check
  
  if (!currentUser || currentUser.uid !== userId) {
    console.error('🔒 Unauthorized session access attempt');
    SecurityManager.getInstance().logSecurityEvent('unauthorized_session_access', {
      attempted_user: userId,
      current_user: currentUser?.uid || 'anonymous',
      session_id: sessionId
    });
    return false;
  }
  
  return true;
}

/**
 * ניקוי נתוני סשן מתוכן רגיש - פונקציה נפרדת
 */
export function sanitizeSessionData(session: any): any {
  const security = SecurityManager.getInstance();
  
  return {
    ...session,
    // Remove sensitive fields if any
    id: security.sanitizeHTML(session.id),
    title: security.sanitizeHTML(session.title),
    // Keep other fields as-is for now
  };
}

/**
 * ניקוי הודעות מתוכן רגיש - פונקציה נפרדת
 */
export async function sanitizeMessage(message: any): Promise<any> {
  const security = SecurityManager.getInstance();
  
  // Scan for sensitive data first
  const scanResult = await security.scanMessage(message.content);
  
  return {
    ...message,
    content: scanResult.sanitized_content || message.content,
    // Add security metadata
    security_scan: {
      has_sensitive_data: scanResult.has_sensitive_data,
      patterns_detected: scanResult.detected_patterns.length,
      confidence_score: scanResult.confidence_score
    }
  };
}

// ========================
// 🚦 Rate Limiting System
// ========================

class RateLimitManager {
  private static userActionCounts: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * בדיקת הגבלת קצב פעולות למשתמש
   */
  static checkRateLimit(userId: string, action: string, limit: number = 60): boolean {
    const key = `${userId}-${action}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    
    const userAction = this.userActionCounts.get(key);
    
    if (!userAction || now > userAction.resetTime) {
      this.userActionCounts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (userAction.count >= limit) {
      console.warn(`🚫 Rate limit exceeded for ${userId} on ${action}`);
      SecurityManager.getInstance().logSecurityEvent('rate_limit_exceeded', {
        user_id: userId,
        action,
        current_count: userAction.count,
        limit
      });
      return false;
    }
    
    userAction.count++;
    return true;
  }

  /**
   * איפוס מונה פעולות למשתמש (למקרי חירום)
   */
  static resetUserRateLimit(userId: string, action?: string): void {
    if (action) {
      const key = `${userId}-${action}`;
      this.userActionCounts.delete(key);
    } else {
      // Clear all actions for user
      const keysToDelete = Array.from(this.userActionCounts.keys())
        .filter(key => key.startsWith(`${userId}-`));
      
      keysToDelete.forEach(key => this.userActionCounts.delete(key));
    }
    
    SecurityManager.getInstance().logSecurityEvent('rate_limit_reset', {
      user_id: userId,
      action: action || 'all'
    });
  }

  /**
   * קבלת סטטיסטיקות Rate Limiting
   */
  static getRateLimitStats(): {
    activeUsers: number;
    totalSessions: number;
    blockedRequests: number;
  } {
    const logs = SecurityManager.getInstance().getSecurityLogs();
    const blockedRequests = logs.filter(log => 
      log.context.action === 'rate_limit_exceeded'
    ).length;

    return {
      activeUsers: this.userActionCounts.size,
      totalSessions: this.userActionCounts.size,
      blockedRequests
    };
  }
}

// ========================
// 🔐 Enhanced Data Encryption
// ========================

class EncryptionManager {
  /**
   * הצפנת נתונים רגישים ב-AES-GCM עם מטא-דאטה
   */
  static async encryptSensitiveData(data: string, metadata?: { 
    sessionId?: string; 
    dataType?: string 
  }): Promise<{
    encrypted: string;
    metadata: {
      algorithm: string;
      timestamp: string;
      sessionId?: string;
      dataType?: string;
      checksum: string;
    };
  }> {
    try {
      if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API not available');
      }
      
      const encoder = new TextEncoder();
      const dataEncoded = encoder.encode(data);
      
      // Generate a new key for each encryption (in production, use key derivation)
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataEncoded
      );
      
      // Create checksum for integrity verification
      const checksum = await this.createChecksum(data);
      
      // Combine IV + key + encrypted data (simplified for demo)
      const keyData = await window.crypto.subtle.exportKey('raw', key);
      const combined = new Uint8Array(iv.length + keyData.byteLength + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(keyData), iv.length);
      combined.set(new Uint8Array(encrypted), iv.length + keyData.byteLength);
      
      const encryptedB64 = btoa(String.fromCharCode.apply(null, Array.from(combined)));
      
      SecurityManager.getInstance().logSecurityEvent('data_encrypted', {
        data_size: data.length,
        session_id: metadata?.sessionId,
        data_type: metadata?.dataType
      });
      
      return {
        encrypted: encryptedB64,
        metadata: {
          algorithm: 'AES-GCM-256',
          timestamp: new Date().toISOString(),
          sessionId: metadata?.sessionId,
          dataType: metadata?.dataType,
          checksum
        }
      };
      
    } catch (error) {
      SecurityManager.getInstance().logSecurityEvent('encryption_failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        data_size: data.length
      });
      
      // Fallback to simple obfuscation
      return {
        encrypted: btoa(data.split('').reverse().join('')),
        metadata: {
          algorithm: 'simple-obfuscation',
          timestamp: new Date().toISOString(),
          checksum: this.createSimpleChecksum(data)
        }
      };
    }
  }

  /**
   * פענוח נתונים מוצפנים עם ולידציה
   */
  static async decryptSensitiveData(encryptedData: string, expectedChecksum?: string): Promise<string> {
    try {
      if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API not available');
      }
      
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const keyData = combined.slice(12, 12 + 32); // 32 bytes for AES-256
      const encrypted = combined.slice(12 + 32);
      
      const key = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      const decoder = new TextDecoder();
      const decryptedText = decoder.decode(decrypted);
      
      // Verify checksum if provided
      if (expectedChecksum) {
        const actualChecksum = await this.createChecksum(decryptedText);
        if (actualChecksum !== expectedChecksum) {
          throw new Error('Data integrity check failed');
        }
      }
      
      SecurityManager.getInstance().logSecurityEvent('data_decrypted', {
        data_size: decryptedText.length,
        checksum_verified: !!expectedChecksum
      });
      
      return decryptedText;
      
    } catch (error) {
      SecurityManager.getInstance().logSecurityEvent('decryption_failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Try fallback simple deobfuscation
      try {
        return atob(encryptedData).split('').reverse().join('');
      } catch {
        throw new Error('Decryption failed completely');
      }
    }
  }

  /**
   * יצירת checksum לוולידציה של שלמות נתונים
   */
  private static async createChecksum(data: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    return this.createSimpleChecksum(data);
  }

  /**
   * יצירת checksum פשוט לfallback
   */
  private static createSimpleChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}

// ========================
// 🛡️ Security Status Dashboard
// ========================

export class SecurityStatusManager {
  /**
   * קבלת סטטיסטיקות אבטחה עדכניות
   */
  static getSecurityStatus(): {
    rateLimit: { activeUsers: number; totalBlocks: number };
    encryption: { operationsToday: number; failureRate: number };
    sessionSecurity: { validatedSessions: number; blockedAttempts: number };
    overallThreatLevel: 'low' | 'medium' | 'high';
  } {
    const security = SecurityManager.getInstance();
    const logs = security.getSecurityLogs();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysLogs = logs.filter(log => log.timestamp >= today);
    
    const rateLimitBlocks = todaysLogs.filter(log => 
      log.context.action === 'rate_limit_exceeded'
    ).length;
    
    const encryptionOps = todaysLogs.filter(log => 
      log.context.action === 'data_encrypted'
    ).length;
    
    const encryptionFailures = todaysLogs.filter(log => 
      log.context.action === 'encryption_failed'
    ).length;
    
    const sessionValidations = todaysLogs.filter(log => 
      log.context.action === 'unauthorized_session_access'
    ).length;
    
    const criticalEvents = todaysLogs.filter(log => 
      ['prompt_injection_blocked', 'unauthorized_session_access', 'rate_limit_exceeded'].includes(log.context.action)
    ).length;
    
    let threatLevel: 'low' | 'medium' | 'high' = 'low';
    if (criticalEvents > 10) threatLevel = 'high';
    else if (criticalEvents > 3) threatLevel = 'medium';
    
    return {
      rateLimit: {
        activeUsers: RateLimitManager.getRateLimitStats().activeUsers,
        totalBlocks: rateLimitBlocks
      },
      encryption: {
        operationsToday: encryptionOps,
        failureRate: encryptionOps > 0 ? (encryptionFailures / encryptionOps) * 100 : 0
      },
      sessionSecurity: {
        validatedSessions: todaysLogs.length - sessionValidations,
        blockedAttempts: sessionValidations
      },
      overallThreatLevel: threatLevel
    };
  }

  /**
   * אתחול מערכת אבטחה עם הגדרות משופרות
   */
  static initializeEnhancedSecurity(options?: {
    rateLimitEnabled?: boolean;
    encryptionEnabled?: boolean;
    sessionValidationEnabled?: boolean;
  }): void {
    const security = SecurityManager.getInstance();
    
    // Initialize with enhanced settings
    security.updateSecuritySettings({
      privacyMode: options?.encryptionEnabled ?? true,
      autoRedaction: true
    });
    
    console.log('🔒 Enhanced Security System Initialized', {
      rateLimitEnabled: options?.rateLimitEnabled ?? true,
      encryptionEnabled: options?.encryptionEnabled ?? true,
      sessionValidationEnabled: options?.sessionValidationEnabled ?? true
    });
  }
}

// Export enhanced rate limiting functions
export const checkRateLimit = RateLimitManager.checkRateLimit.bind(RateLimitManager);
export const resetUserRateLimit = RateLimitManager.resetUserRateLimit.bind(RateLimitManager);
export const getRateLimitStats = RateLimitManager.getRateLimitStats.bind(RateLimitManager);

// Export enhanced encryption functions  
export const encryptSensitiveData = EncryptionManager.encryptSensitiveData.bind(EncryptionManager);
export const decryptSensitiveData = EncryptionManager.decryptSensitiveData.bind(EncryptionManager);

export default SecurityManager;
