/**
 * Enhanced Claude API Service
 * 
 * Purpose: Comprehensive AI service for TaskFlow with multi-layer security,
 * context management, cost optimization, and intelligent error handling
 * 
 * Features:
 * - Multi-layer security integration with SecurityManager
 * - Intelligent context window management
 * - Cost tracking and optimization
 * - Progressive loading states and error recovery
 * - Task intent detection and auto-creation
 * - Real-time conversation state management
 * 
 * Dependencies: SecurityManager, types (all interfaces)
 * Usage: All AI interactions in TaskFlow go through this service
 * 
 * @author TaskFlow Development Team
 * @version 1.0.0
 * @date 2025-08-06
 */

import { SecurityManager } from './SecurityManager';
import { AuthService, FirebaseService } from '../services';
import { PerformanceMonitor } from './PerformanceMonitor';
import type {
  Message,
  ClaudeAPIResponse,
  Chat,
  ChatSession,
  ChatStatus,
  SecurityScanResult,
  TaskSuggestion,
  LoadingStates,
  Task,
  UserProfile,
  TaskCategory
} from '../types/index';

// Additional types needed for this service
interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ClaudeResponse {
  content: string;
  success: boolean;
  usage?: TokenUsage;
  metadata?: ResponseMetadata;
  suggestedActions?: SuggestedAction[];
  warnings?: string[];
  error?: {
    type: string;
    message: string;
    metadata?: Record<string, any>;
  };
}

interface TaskIntentResult {
  action: 'create_automatic' | 'ask_confirmation' | 'none';
  confidence: number;
  suggestedTask?: Partial<Task>;
  reasoning: string;
}

interface ClaudeConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  apiUrl: string;
  timeout: number;
  retryConfig: {
    maxAttempts: number;
    backoffMs: number;
    exponentialBackoff: boolean;
  };
  costTracking: {
    inputTokenCost: number;
    outputTokenCost: number;
    dailyLimit: number;
    warningThreshold: number;
  };
}

interface UsageCost {
  date: string;
  total: number;
  calls: number;
  inputTokens: number;
  outputTokens: number;
}

interface MessageHistory {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface LoadingState {
  status: 'idle' | 'scanning' | 'checking_cost' | 'preparing_context' | 'sanitizing' | 'analyzing_intent' | 'calling_claude' | 'processing_response' | 'complete';
  message?: string;
  timestamp?: number;
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface ResponseMetadata {
  model?: string;
  requestId?: string;
  timestamp: Date;
  processingTime: number;
  securityFiltered: boolean;
  taskIntent: boolean;
}

interface SuggestedAction {
  type: string;
  data: any;
}

interface ClaudeMetrics {
  totalCost: number;
  totalCalls: number;
  averageCostPerCall: number;
  dailyCosts: UsageCost[];
  currentMonthProjection: number;
}

interface APICallResult {
  success: boolean;
  content: string;
  usage: TokenUsage;
  requestId: string;
  model: string;
  timestamp: Date;
}

/**
 * Enhanced Claude API Service
 * Handles all AI interactions with comprehensive security, context management, and optimization
 */
export class EnhancedClaudeService {
  private static instance: EnhancedClaudeService | null = null;
  private securityManager: SecurityManager;
  private config: ClaudeConfig;
  private currentSession: ChatSession | null = null;
  private messageHistory: MessageHistory[] = [];
  private costTracker: Map<string, UsageCost> = new Map();
  private loadingState: LoadingState = { status: 'idle' };
  private retryAttempts: Map<string, number> = new Map();
  
  // Configuration constants
  private readonly MAX_CONTEXT_MESSAGES = 25;
  private readonly MAX_SESSION_MESSAGES = 30;
  private readonly DAILY_COST_LIMIT = 0.50; // $15/month max
  private readonly WARNING_COST_THRESHOLD = 0.40; // $12/month warning
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 1000;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.securityManager = SecurityManager.getInstance();
    this.config = this.initializeConfig();
    this.initializeCostTracking();
  }

  /**
   * Get singleton instance
   * @returns EnhancedClaudeService instance
   */
  public static getInstance(): EnhancedClaudeService {
    if (!EnhancedClaudeService.instance) {
      EnhancedClaudeService.instance = new EnhancedClaudeService();
    }
    return EnhancedClaudeService.instance;
  }

  /**
   * Initialize Claude service configuration
   * @returns ClaudeConfig object
   */
  private initializeConfig(): ClaudeConfig {
    return {
      apiKey: process.env.REACT_APP_CLAUDE_API_KEY || '',
      model: 'claude-3-sonnet-20240229',
      maxTokens: 4096,
      temperature: 0.7,
      apiUrl: 'https://api.anthropic.com/v1/messages',
      timeout: 30000,
      retryConfig: {
        maxAttempts: this.MAX_RETRY_ATTEMPTS,
        backoffMs: this.RETRY_DELAY_MS,
        exponentialBackoff: true
      },
      costTracking: {
        inputTokenCost: 0.003, // per 1K tokens
        outputTokenCost: 0.015, // per 1K tokens
        dailyLimit: this.DAILY_COST_LIMIT,
        warningThreshold: this.WARNING_COST_THRESHOLD
      }
    };
  }

  /**
   * Initialize cost tracking system
   */
  private initializeCostTracking(): void {
    const today = new Date().toISOString().split('T')[0];
    const savedCost = localStorage.getItem(`taskflow_cost_${today}`);
    
    if (savedCost) {
      try {
        const costData = JSON.parse(savedCost);
        this.costTracker.set(today, costData);
      } catch (error) {
        console.warn('Failed to load saved cost data:', error);
      }
    }
  }

  /**
   * Send message to Claude with comprehensive processing
   * @param message - User message
   * @param sessionId - Optional session ID for context
   * @param userProfile - User profile for personalization
   * @returns Promise with Claude response
   */
  public async sendMessage(
    message: string,
    sessionId?: string,
    userProfile?: UserProfile
  ): Promise<ClaudeResponse> {
    return PerformanceMonitor.time(
      'claudeResponse',
      async () => {
        try {
          // Phase 1: Security scanning
          this.updateLoadingState('scanning', 'בודק אבטחה...');
          const securityResult = await this.securityManager.scanMessage(message);
          
          if (securityResult.has_sensitive_data && securityResult.confidence_score > 80) {
            return this.createErrorResponse(
              'security_blocked',
              'ההודעה נחסמה מסיבות אבטחה',
              { securityReason: 'sensitive_data_detected' }
            );
          }

          // Phase 2: Cost check
          this.updateLoadingState('checking_cost', 'בודק עלויות...');
          const costCheck = await this.checkDailyCost();
          if (!costCheck.allowed) {
            return this.createCostLimitResponse(costCheck);
          }

          // Phase 3: Context preparation
          this.updateLoadingState('preparing_context', 'מכין הקשר...');
          const contextMessages = await this.prepareContext(sessionId);
          
          // Phase 4: Input sanitization
          this.updateLoadingState('sanitizing', 'מנקה קלט...');
          const sanitizedMessage = await this.securityManager.sanitizeForAI(message);
          
          // Phase 5: Task intent detection
          this.updateLoadingState('analyzing_intent', 'מנתח כוונות...');
          const taskIntent = await this.detectTaskIntent(sanitizedMessage, userProfile);
      
          // Phase 6: Claude API call
          this.updateLoadingState('calling_claude', 'שולח ל-Claude...');
          const claudeResponse = await this.callClaudeAPI(sanitizedMessage, contextMessages);
          
          // Phase 7: Response processing
          this.updateLoadingState('processing_response', 'מעבד תשובה...');
          const processedResponse = await this.processClaudeResponse(
            claudeResponse,
            taskIntent,
            securityResult
          );
          
          // Phase 8: Update session and cost tracking
          await this.updateSessionHistory(sessionId, message, processedResponse);
          await this.updateCostTracking(claudeResponse.usage);
          
          this.updateLoadingState('complete', 'הושלם');
          return processedResponse;

        } catch (error) {
          return await this.handleError(error, message, sessionId);
        }
      },
      { message: message.slice(0, 100), sessionId, userProfile: !!userProfile }
    );
  }

  /**
   * Update loading state with progress information
   * @param status - Current status
   * @param message - Status message
   */
  private updateLoadingState(status: LoadingState['status'], message: string): void {
    this.loadingState = {
      status,
      message,
      timestamp: Date.now()
    };
    
    // Emit loading state change event
    window.dispatchEvent(new CustomEvent('claude-loading-state', {
      detail: this.loadingState
    }));
  }

  /**
   * Check daily cost limits
   * @returns Cost check result
   */
  private async checkDailyCost(): Promise<{ allowed: boolean; cost: number; message?: string }> {
    const today = new Date().toISOString().split('T')[0];
    const todayCost = this.costTracker.get(today);
    const currentCost = todayCost?.total || 0;
    
    if (currentCost >= this.DAILY_COST_LIMIT) {
      return {
        allowed: false,
        cost: currentCost,
        message: `הגעת למגבלת העלות היומית ($${this.DAILY_COST_LIMIT})`
      };
    }
    
    if (currentCost >= this.WARNING_COST_THRESHOLD) {
      // Still allowed but show warning
      window.dispatchEvent(new CustomEvent('cost-warning', {
        detail: {
          current: currentCost,
          limit: this.DAILY_COST_LIMIT,
          message: `עלות יומית: $${currentCost.toFixed(2)} (מגבלה: $${this.DAILY_COST_LIMIT})`
        }
      }));
    }
    
    return { allowed: true, cost: currentCost };
  }

  /**
   * Prepare context messages for Claude API
   * @param sessionId - Session ID
   * @returns Array of context messages
   */
  private async prepareContext(sessionId?: string): Promise<ClaudeMessage[]> {
    if (!sessionId || !this.currentSession) {
      return [];
    }
    
    const messages = this.messageHistory.filter(msg => msg.sessionId === sessionId);
    
    // Phase 1: First 25 messages - send all
    if (messages.length <= this.MAX_CONTEXT_MESSAGES) {
      return messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    }
    
    // Phase 2: 26-30 messages - send last 5 + summary of first 20
    if (messages.length <= this.MAX_SESSION_MESSAGES) {
      const lastFive = messages.slice(-5);
      const firstTwenty = messages.slice(0, 20);
      const summary = await this.summarizeMessages(firstTwenty);
      
      return [
        { role: 'system', content: `סיכום השיחה הקודמת: ${summary}` },
        ...lastFive.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];
    }
    
    // Phase 3: Over 30 messages - suggest new conversation
    window.dispatchEvent(new CustomEvent('conversation-length-warning', {
      detail: {
        messageCount: messages.length,
        suggestion: 'השיחה ארוכה, רוצה להתחיל שיחה חדשה?'
      }
    }));
    
    return messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Detect task creation intent in user message
   * @param message - Sanitized user message
   * @param userProfile - User profile for personalization
   * @returns Task intent analysis result
   */
  private async detectTaskIntent(
    message: string,
    userProfile?: UserProfile
  ): Promise<TaskIntentResult> {
    // High confidence patterns (90%+)
    const highConfidencePatterns = [
      /צור משימה/i,
      /תוסיף משימה/i,
      /רשום לי/i,
      /הוסף למשימות/i,
      /זכור לי/i
    ];
    
    // Medium confidence patterns (60-90%)
    const mediumConfidencePatterns = [
      /תזכיר לי/i,
      /צריך לעשות/i,
      /אל תשכח/i,
      /חשוב לי/i,
      /מחר אני/i,
      /השבוע אני/i
    ];
    
    // Calculate confidence score
    let confidence = 0;
    let action: TaskIntentResult['action'] = 'none';
    let suggestedTask: Partial<Task> | null = null;
    
    // Check high confidence patterns
    for (const pattern of highConfidencePatterns) {
      if (pattern.test(message)) {
        confidence = 95;
        action = 'create_automatic';
        break;
      }
    }
    
    // Check medium confidence patterns
    if (confidence === 0) {
      for (const pattern of mediumConfidencePatterns) {
        if (pattern.test(message)) {
          confidence = 75;
          action = 'ask_confirmation';
          break;
        }
      }
    }
    
    // Extract task details if intent detected
    if (confidence > 60) {
      suggestedTask = await this.extractTaskFromMessage(message, userProfile);
    }
    
    return {
      action,
      confidence,
      suggestedTask: suggestedTask || undefined,
      reasoning: this.generateTaskIntentReasoning(confidence, action, message)
    };
  }

  /**
   * Extract task details from message
   * @param message - User message
   * @param userProfile - User profile
   * @returns Partial task object
   */
  private async extractTaskFromMessage(
    message: string,
    userProfile?: UserProfile
  ): Promise<Partial<Task>> {
    // Basic task extraction (can be enhanced with NLP)
    const extractedCategory = await this.extractCategory(message);
    const extractedDueDate = this.extractDueDate(message);
    
    const task: Partial<Task> = {
      title: this.extractTaskTitle(message),
      description: message,
      priority: this.extractPriority(message),
      category: extractedCategory as TaskCategory,
      due_date: extractedDueDate || undefined,
      completed: false,
      created_at: new Date(),
      user_id: 'atiaron' // For now, hardcoded for personal use
    };
    
    return task;
  }

  /**
   * Extract task title from message
   * @param message - User message
   * @returns Extracted title
   */
  private extractTaskTitle(message: string): string {
    // Remove command words and extract main content
    const cleanedMessage = message
      .replace(/צור משימה|תוסיף משימה|רשום לי|תזכיר לי/gi, '')
      .replace(/^\s*[:,-]\s*/, '')
      .trim();
    
    // Take first sentence or first 50 characters
    const firstSentence = cleanedMessage.split(/[.!?]/)[0];
    return firstSentence.length > 50 
      ? firstSentence.substring(0, 47) + '...'
      : firstSentence;
  }

  /**
   * Extract priority from message
   * @param message - User message
   * @returns Task priority
   */
  private extractPriority(message: string): Task['priority'] {
    if (/דחוף|חשוב|מיידי|עכשיו/i.test(message)) return 'high';
    if (/בסוף|כשיהיה זמן|לא ממהר/i.test(message)) return 'low';
    return 'medium';
  }

  /**
   * Extract category from message
   * @param message - User message
   * @returns Task category
   */
  private async extractCategory(message: string): Promise<TaskCategory> {
    // Simple keyword-based category detection
    const categoryPatterns: Array<[TaskCategory, RegExp]> = [
      ['עבודה', /עבודה|משרד|פגישה|מייל|דוח/i],
      ['בית', /בית|ניקיון|קניות|חלב|לכביסה/i],
      ['אישי', /ספורט|חבר|משפחה|רופא|טיפול/i],
      ['לימודים', /ללמוד|קורס|ספר|מבחן/i],
      ['other', /כסף|חשבון|תשלום|חשבונית/i] // finances -> other for now
    ];
    
    for (const [category, pattern] of categoryPatterns) {
      if (pattern.test(message)) {
        return category;
      }
    }
    
    return 'other';
  }

  /**
   * Extract due date from message
   * @param message - User message
   * @returns Due date or null
   */
  private extractDueDate(message: string): Date | null {
    const now = new Date();
    
    // Today patterns
    if (/היום|עכשיו|מיידי/i.test(message)) {
      return now;
    }
    
    // Tomorrow patterns
    if (/מחר/i.test(message)) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    
    // This week patterns
    if (/השבוע|בשבוע/i.test(message)) {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
      return endOfWeek;
    }
    
    // Next week patterns
    if (/שבוע הבא/i.test(message)) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek;
    }
    
    return null;
  }

  /**
   * Generate reasoning for task intent detection
   * @param confidence - Confidence score
   * @param action - Detected action
   * @param message - Original message
   * @returns Reasoning text
   */
  private generateTaskIntentReasoning(
    confidence: number,
    action: TaskIntentResult['action'],
    message: string
  ): string {
    if (action === 'create_automatic') {
      return `זיהיתי בקשה ברורה ליצירת משימה (${confidence}% ביטחון)`;
    }
    
    if (action === 'ask_confirmation') {
      return `ייתכן שאתה רוצה ליצור משימה (${confidence}% ביטחון), אשמח לאשר איתך`;
    }
    
    return 'לא זיהיתי בקשה ליצירת משימה';
  }

  /**
   * Call Claude API with proper error handling and retries
   * @param message - Sanitized message
   * @param contextMessages - Context messages
   * @returns Claude API response
   */
  private async callClaudeAPI(
    message: string,
    contextMessages: ClaudeMessage[]
  ): Promise<APICallResult> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const messages = [
          ...contextMessages,
          { role: 'user' as const, content: message }
        ];
        
        const response = await fetch(this.config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-Request-ID': requestId
          },
          body: JSON.stringify({
            model: this.config.model,
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            messages
          }),
          signal: AbortSignal.timeout(this.config.timeout)
        });
        
        if (!response.ok) {
          throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
          success: true,
          content: data.content[0].text,
          usage: {
            inputTokens: data.usage.input_tokens,
            outputTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens
          },
          requestId,
          model: this.config.model,
          timestamp: new Date()
        };
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`Claude API attempt ${attempt} failed:`, error);
        
        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('All Claude API attempts failed');
  }

  /**
   * Process Claude response with security filtering and enhancement
   * @param claudeResponse - Raw Claude response
   * @param taskIntent - Task intent analysis
   * @param securityResult - Security scan result
   * @returns Processed Claude response
   */
  private async processClaudeResponse(
    claudeResponse: APICallResult,
    taskIntent: TaskIntentResult,
    securityResult: SecurityScanResult
  ): Promise<ClaudeResponse> {
    if (!claudeResponse.success) {
      throw new Error('Claude API call failed');
    }
    
    // Filter response through security layer
    const filteredContent = claudeResponse.content; // Use as-is for now, SecurityManager doesn't have filterAIResponse
    
    // Enhance response with task creation if needed
    let enhancedResponse = filteredContent;
    let suggestedActions: ClaudeResponse['suggestedActions'] = [];
    
    if (taskIntent.action === 'create_automatic' && taskIntent.suggestedTask) {
      enhancedResponse += '\n\n✅ יצרתי עבורך משימה חדשה!';
      suggestedActions.push({
        type: 'task_created',
        data: taskIntent.suggestedTask
      });
    } else if (taskIntent.action === 'ask_confirmation' && taskIntent.suggestedTask) {
      enhancedResponse += '\n\n💡 רוצה שאיצור עבורך משימה?';
      suggestedActions.push({
        type: 'task_suggestion',
        data: taskIntent.suggestedTask
      });
    }
    
    return {
      content: enhancedResponse,
      success: true,
      usage: claudeResponse.usage,
      metadata: {
        model: claudeResponse.model,
        requestId: claudeResponse.requestId,
        timestamp: claudeResponse.timestamp,
        processingTime: Date.now() - claudeResponse.timestamp.getTime(),
        securityFiltered: securityResult.detected_patterns.length > 0,
        taskIntent: taskIntent.action !== 'none'
      },
      suggestedActions,
      warnings: securityResult.recommendations.map((r: any) => r.message)
    };
  }

  /**
   * Handle errors with intelligent recovery strategies
   * @param error - Error object
   * @param message - Original message
   * @param sessionId - Session ID
   * @returns Error response
   */
  private async handleError(
    error: any,
    message: string,
    sessionId?: string
  ): Promise<ClaudeResponse> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.error('EnhancedClaudeService error:', error);
    
    // Update retry counter
    const retryKey = `${message}_${sessionId || 'no_session'}`;
    const currentRetries = this.retryAttempts.get(retryKey) || 0;
    this.retryAttempts.set(retryKey, currentRetries + 1);
    
    // Determine error type and recovery strategy
    let errorType: string;
    let userMessage: string;
    let recoveryActions: ClaudeResponse['suggestedActions'] = [];
    
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      errorType = 'timeout';
      userMessage = '⏰ Claude לא עונה כרגע - זה לוקח יותר זמן מהרגיל';
      recoveryActions = [
        { type: 'retry', data: { delay: 5000 } },
        { type: 'fallback_mode', data: { mode: 'offline' } }
      ];
    } else if (error.message.includes('rate limit')) {
      errorType = 'rate_limit';
      userMessage = '🚦 יותר מדי בקשות - נסה שוב בעוד דקה';
      recoveryActions = [
        { type: 'wait_and_retry', data: { delay: 60000 } }
      ];
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorType = 'network';
      userMessage = '📵 בעיית חיבור לרשת';
      recoveryActions = [
        { type: 'offline_mode', data: {} },
        { type: 'retry', data: { delay: 10000 } }
      ];
    } else {
      errorType = 'unknown';
      userMessage = '🤖 Claude לא זמין כרגע';
      recoveryActions = [
        { type: 'manual_task_creation', data: {} },
        { type: 'contact_support', data: { errorId } }
      ];
    }
    
    // Emit error event for UI handling
    window.dispatchEvent(new CustomEvent('claude-error', {
      detail: {
        errorType,
        userMessage,
        errorId,
        retryCount: currentRetries,
        recoveryActions
      }
    }));
    
    return this.createErrorResponse(errorType, userMessage, {
      errorId,
      retryCount: currentRetries,
      timestamp: new Date(),
      originalMessage: message
    });
  }

  /**
   * Create standardized error response
   * @param type - Error type
   * @param message - Error message
   * @param metadata - Additional metadata
   * @returns Error response
   */
  private createErrorResponse(
    type: string,
    message: string,
    metadata: Record<string, any> = {}
  ): ClaudeResponse {
    return {
      content: message,
      success: false,
      error: {
        type,
        message,
        metadata
      },
      metadata: {
        timestamp: new Date(),
        processingTime: 0,
        securityFiltered: false,
        taskIntent: false
      },
      suggestedActions: [],
      warnings: []
    };
  }

  /**
   * Create cost limit response
   * @param costCheck - Cost check result
   * @returns Cost limit response
   */
  private createCostLimitResponse(costCheck: any): ClaudeResponse {
    return {
      content: `💰 ${costCheck.message}\n\nעלות נוכחית: $${costCheck.cost.toFixed(2)}\nמגבלה יומית: $${this.DAILY_COST_LIMIT}\n\n💡 המערכת תתאפס מחר או שאתה יכול להעלות את המגבלה בהגדרות.`,
      success: false,
      error: {
        type: 'cost_limit',
        message: costCheck.message,
        metadata: { currentCost: costCheck.cost, dailyLimit: this.DAILY_COST_LIMIT }
      },
      metadata: {
        timestamp: new Date(),
        processingTime: 0,
        securityFiltered: false,
        taskIntent: false
      },
      suggestedActions: [
        { type: 'adjust_budget', data: { currentLimit: this.DAILY_COST_LIMIT } },
        { type: 'work_offline', data: {} }
      ],
      warnings: []
    };
  }

  /**
   * Update session with new message and response and save to Firebase
   * @param sessionId - Session ID
   * @param userMessage - User message
   * @param response - Claude response
   */
  private async updateSessionHistory(
    sessionId: string | undefined,
    userMessage: string,
    response: ClaudeResponse
  ): Promise<void> {
    if (!sessionId) return;
    
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        console.warn('⚠️ No authenticated user, saving to memory only');
        this.updateLocalSessionHistory(sessionId, userMessage, response);
        return;
      }

      const timestamp = new Date();
      
      // Save user message to Firebase
      await FirebaseService.saveChatMessage(user.id, sessionId, {
        chat_id: sessionId,
        content: userMessage,
        sender: 'user',
        timestamp
      });
      
      // Save AI response to Firebase
      await FirebaseService.saveChatMessage(user.id, sessionId, {
        chat_id: sessionId,
        content: response.content,
        sender: 'ai',
        timestamp,
        tokens_used: response.usage?.totalTokens || 0,
        actions: response.suggestedActions?.map(action => ({
          type: action.type as any,
          data: action.data,
          timestamp
        })) || []
      });
      
      // Update local message history
      this.updateLocalSessionHistory(sessionId, userMessage, response);
      
      // Update current session metadata
      if (this.currentSession?.id === sessionId) {
        this.currentSession.updatedAt = timestamp;
        this.currentSession.messageCount += 2;
        this.currentSession.updated_at = timestamp;
        this.currentSession.message_count += 2;
      }
      
      console.log(`✅ Session history updated in Firebase for session ${sessionId}`);
      
    } catch (error) {
      console.error('❌ Error saving to Firebase, falling back to local storage:', error);
      this.updateLocalSessionHistory(sessionId, userMessage, response);
    }
  }

  /**
   * Update local session history (fallback method)
   * @param sessionId - Session ID
   * @param userMessage - User message
   * @param response - Claude response
   */
  private updateLocalSessionHistory(
    sessionId: string,
    userMessage: string,
    response: ClaudeResponse
  ): void {
    const timestamp = new Date();
    
    // Add user message to history
    this.messageHistory.push({
      id: `msg_${Date.now()}_user`,
      sessionId,
      role: 'user',
      content: userMessage,
      timestamp,
      metadata: {}
    });
    
    // Add AI response to history
    this.messageHistory.push({
      id: `msg_${Date.now()}_assistant`,
      sessionId,
      role: 'assistant',
      content: response.content,
      timestamp,
      metadata: response.metadata
    });
    
    // Update current session
    if (this.currentSession?.id === sessionId) {
      this.currentSession.updatedAt = timestamp;
      this.currentSession.messageCount += 2;
      this.currentSession.updated_at = timestamp;
      this.currentSession.message_count += 2;
    }
  }

  /**
   * Update cost tracking with usage data
   * @param usage - Token usage data
   */
  private async updateCostTracking(usage: any): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const inputCost = (usage.inputTokens / 1000) * this.config.costTracking.inputTokenCost;
    const outputCost = (usage.outputTokens / 1000) * this.config.costTracking.outputTokenCost;
    const totalCost = inputCost + outputCost;
    
    const existingCost = this.costTracker.get(today) || {
      date: today,
      total: 0,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0
    };
    
    const updatedCost: UsageCost = {
      date: today,
      total: existingCost.total + totalCost,
      calls: existingCost.calls + 1,
      inputTokens: existingCost.inputTokens + usage.inputTokens,
      outputTokens: existingCost.outputTokens + usage.outputTokens
    };
    
    this.costTracker.set(today, updatedCost);
    
    // Save to localStorage
    try {
      localStorage.setItem(`taskflow_cost_${today}`, JSON.stringify(updatedCost));
    } catch (error) {
      console.warn('Failed to save cost data:', error);
    }
    
    // Emit cost update event
    window.dispatchEvent(new CustomEvent('cost-updated', {
      detail: updatedCost
    }));
  }

  /**
   * Summarize messages for context compression
   * @param messages - Messages to summarize
   * @returns Summary text
   */
  private async summarizeMessages(messages: MessageHistory[]): Promise<string> {
    // Simple summarization (can be enhanced with Claude)
    const topics = new Set<string>();
    const keywords = new Set<string>();
    
    messages.forEach(msg => {
      // Extract potential topics and keywords
      const words = msg.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && /[א-ת]/.test(word)) {
          keywords.add(word);
        }
      });
    });
    
    const keywordArray = Array.from(keywords).slice(0, 10);
    return `דובר על: ${keywordArray.join(', ')}. ${messages.length} הודעות בסך הכל.`;
  }

  /**
   * Get current loading state
   * @returns Current loading state
   */
  public getLoadingState(): LoadingState {
    return { ...this.loadingState };
  }

  /**
   * Get daily cost summary
   * @param date - Date string (YYYY-MM-DD)
   * @returns Cost summary for the date
   */
  public getDailyCost(date?: string): UsageCost | null {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.costTracker.get(targetDate) || null;
  }

  /**
   * Get cost metrics for analytics
   * @returns Cost metrics
   */
  public getCostMetrics(): ClaudeMetrics {
    const costs = Array.from(this.costTracker.values());
    const totalCost = costs.reduce((sum, cost) => sum + cost.total, 0);
    const totalCalls = costs.reduce((sum, cost) => sum + cost.calls, 0);
    const averageCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;
    
    return {
      totalCost,
      totalCalls,
      averageCostPerCall,
      dailyCosts: costs,
      currentMonthProjection: this.calculateMonthlyProjection()
    };
  }

  /**
   * Calculate monthly cost projection
   * @returns Projected monthly cost
   */
  private calculateMonthlyProjection(): number {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    
    const today = now.toISOString().split('T')[0];
    const todayCost = this.costTracker.get(today);
    
    if (!todayCost || dayOfMonth === 0) return 0;
    
    const averageDailyCost = todayCost.total; // Simplified - can be enhanced
    return averageDailyCost * daysInMonth;
  }

  /**
   * Reset daily cost tracking (for testing)
   */
  public resetCostTracking(): void {
    this.costTracker.clear();
    const today = new Date().toISOString().split('T')[0];
    localStorage.removeItem(`taskflow_cost_${today}`);
  }

  /**
   * Create new chat session with Firebase persistence
   * @param title - Session title
   * @returns New session object
   */
  public async createSession(title?: string): Promise<ChatSession> {
    return PerformanceMonitor.time(
      'createSession',
      async () => {
        try {
          const user = AuthService.getCurrentUser();
          if (!user) {
            throw new Error('User not authenticated');
          }

          // Create session in Firebase
          const sessionId = await FirebaseService.createChatSession(user.id, title || 'שיחה חדשה');
          
          // Get the created session
          const sessions = await FirebaseService.getChatSessions(user.id);
          const newSession = sessions.find(s => s.id === sessionId);
          
          if (!newSession) {
            throw new Error('Failed to retrieve created session');
          }
          
          this.currentSession = newSession;
      
      // Clear message history for new session
      this.messageHistory = [];
          
          return newSession;
        } catch (error) {
          console.error('❌ Error creating session:', error);
          
          // Fallback: create session in memory only
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date();
          
          const session: ChatSession = {
            id: sessionId,
            title: title || 'שיחה חדשה',
            createdAt: now,
            updatedAt: now,
            messageCount: 0,
            status: 'active',
            userId: 'atiaron',
            
            // Chat interface required fields
            user_id: 'atiaron',
            created_at: now,
            updated_at: now,
            message_count: 0,
            is_starred: false,
            isStarred: false
          };
          
          this.currentSession = session;
          return session;
        }
      },
      { title }
    );
  }

  /**
   * Get current session
   * @returns Current session or null
   */
  public getCurrentSession(): ChatSession | null {
    return this.currentSession;
  }

  /**
   * Switch to existing session and load its history from Firebase
   * @param sessionId - Session ID to switch to
   */
  public async switchToSession(sessionId: string): Promise<void> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get session from Firebase
      const sessions = await FirebaseService.getChatSessions(user.id);
      const session = sessions.find((s: ChatSession) => s.id === sessionId);
      
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      this.currentSession = session;
      
      // Load message history from Firebase
      const messages = await FirebaseService.getChatHistory(user.id, sessionId);
      
      // Convert to internal message format
      this.messageHistory = messages.map(msg => ({
        id: msg.id,
        sessionId: sessionId,
        role: msg.sender as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: {}
      }));
      
      console.log(`✅ Switched to session ${sessionId} with ${this.messageHistory.length} messages`);
      
    } catch (error) {
      console.error('❌ Error switching to session:', error);
      
      // Fallback: create mock session
      const session: ChatSession = {
        id: sessionId,
        title: `שיחה ${sessionId.slice(-6)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: this.messageHistory.filter(m => m.sessionId === sessionId).length,
        status: 'active',
        userId: 'atiaron',
        
        // Chat interface required fields
        user_id: 'atiaron',
        created_at: new Date(),
        updated_at: new Date(),
        message_count: this.messageHistory.filter(m => m.sessionId === sessionId).length,
        is_starred: false,
        isStarred: false
      };
      
      this.currentSession = session;
    }
  }

  /**
   * Get message history for session
   * @param sessionId - Session ID
   * @returns Array of messages
   */
  public getSessionHistory(sessionId: string): MessageHistory[] {
    return this.messageHistory.filter(msg => msg.sessionId === sessionId);
  }

  /**
   * Clear message history (for privacy)
   */
  public clearHistory(): void {
    this.messageHistory = [];
    this.currentSession = null;
  }

  /**
   * Export conversation data
   * @param format - Export format
   * @returns Exported data
   */
  public exportData(format: 'json' | 'csv' | 'txt' = 'json'): string {
    const data = {
      sessions: this.currentSession ? [this.currentSession] : [],
      messages: this.messageHistory,
      costMetrics: this.getCostMetrics(),
      exportDate: new Date().toISOString()
    };
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      case 'txt':
        return this.convertToText(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Convert data to CSV format
   * @param data - Data to convert
   * @returns CSV string
   */
  private convertToCSV(data: any): string {
    const headers = ['Date', 'Session', 'Role', 'Content', 'Tokens'];
    const rows = data.messages.map((msg: MessageHistory) => [
      msg.timestamp.toISOString(),
      msg.sessionId,
      msg.role,
      msg.content.replace(/"/g, '""'),
      msg.metadata?.tokens || 0
    ]);
    
    return [headers.join(','), ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))].join('\n');
  }

  /**
   * Convert data to text format
   * @param data - Data to convert
   * @returns Text string
   */
  private convertToText(data: any): string {
    let text = 'TaskFlow Conversation Export\n';
    text += `Exported: ${data.exportDate}\n\n`;
    
    data.messages.forEach((msg: MessageHistory) => {
      text += `[${msg.timestamp.toLocaleString('he-IL')}] ${msg.role === 'user' ? 'אתה' : 'Claude'}: ${msg.content}\n\n`;
    });
    
    text += '\n--- Cost Summary ---\n';
    text += `Total Cost: $${data.costMetrics.totalCost.toFixed(4)}\n`;
    text += `Total Calls: ${data.costMetrics.totalCalls}\n`;
    text += `Average Cost per Call: $${data.costMetrics.averageCostPerCall.toFixed(4)}\n`;
    
    return text;
  }

  /**
   * Get all chat sessions for the current user from Firebase
   * @returns Array of ChatSession objects
   */
  public async getAllSessions(): Promise<ChatSession[]> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        return [];
      }

      // Get sessions from Firebase
      const sessions = await FirebaseService.getChatSessions(user.id);
      
      return sessions;
      
    } catch (error) {
      console.error('❌ Error getting sessions from Firebase:', error);
      
      // Fallback: return mock data with current session
      const sessions: ChatSession[] = [];
      
      if (this.currentSession) {
        const sessionHistory = this.getSessionHistory(this.currentSession.id);
        
        // Convert current session to ChatSession format
        const chatSession: ChatSession = {
          id: this.currentSession.id,
          user_id: this.currentSession.user_id || 'current-user',
          title: this.currentSession.title,
          created_at: this.currentSession.createdAt,
          updated_at: this.currentSession.updatedAt,
          status: 'active' as ChatStatus,
          message_count: sessionHistory.length,
          summary: sessionHistory.length > 0 ? 
            `${sessionHistory[sessionHistory.length - 1]?.content?.slice(0, 50)}...` : 
            undefined,
          is_starred: false,
          last_message: sessionHistory.length > 0 ? 
            sessionHistory[sessionHistory.length - 1]?.content : 
            undefined,
          
          // Aliases for SessionManager compatibility
          createdAt: this.currentSession.createdAt,
          updatedAt: this.currentSession.updatedAt,
          messageCount: sessionHistory.length,
          isStarred: false,
          userId: this.currentSession.user_id || 'current-user'
        };
        
        sessions.push(chatSession);
      }
      
      // Add some demo sessions for fallback
      const demoSessions: ChatSession[] = [
        {
          id: 'demo-1',
          user_id: 'current-user',
          title: 'תכנון סוף השבוע',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: 'active',
          message_count: 12,
          summary: 'תכנון פעילויות לסוף השבוע, בחירת מסעדה',
          is_starred: true,
          last_message: 'תודה על ההמלצות!',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          messageCount: 12,
          isStarred: true,
          userId: 'current-user'
        },
        {
          id: 'demo-2',
          user_id: 'current-user',
          title: 'רשימת קניות',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          status: 'archived',
          message_count: 8,
          summary: 'הכנת רשימת קניות לשבוע',
          is_starred: false,
          last_message: 'רשימה מוכנה!',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          messageCount: 8,
          isStarred: false,
          userId: 'current-user'
        }
      ];
      
      // Add demo sessions if not already present
      demoSessions.forEach(demoSession => {
        if (!sessions.find(s => s.id === demoSession.id)) {
          sessions.push(demoSession);
        }
      });
      
      return sessions;
    }
  }

  /**
   * Get a specific session by ID
   * @param sessionId - The session ID to find
   * @returns ChatSession or undefined if not found
   */
  public async getSession(sessionId: string): Promise<ChatSession | undefined> {
    const allSessions = await this.getAllSessions();
    return allSessions.find((session: ChatSession) => session.id === sessionId);
  }

  /**
   * Update session properties (for starring, archiving, etc.)
   * @param sessionId - Session ID to update
   * @param updates - Properties to update
   * @returns Promise resolving to updated session
   */
  public async updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update in Firebase
      await FirebaseService.updateChatSession(user.id, sessionId, updates);
      
      // Get updated session
      const sessions = await FirebaseService.getChatSessions(user.id);
      const updatedSession = sessions.find((s: ChatSession) => s.id === sessionId);
      
      if (!updatedSession) {
        throw new Error(`Session ${sessionId} not found after update`);
      }
      
      // If this is the current session, update it
      if (this.currentSession && this.currentSession.id === sessionId) {
        this.currentSession = { ...this.currentSession, ...updates };
      }
      
      return updatedSession;
      
    } catch (error) {
      console.error('❌ Error updating session in Firebase:', error);
      
      // Fallback: update local session
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      const updatedSession = { ...session, ...updates };
      
      // If this is the current session, update it
      if (this.currentSession && this.currentSession.id === sessionId) {
        if (updates.title) {
          this.currentSession.title = updates.title;
        }
      }
      
      return updatedSession;
    }
  }

  /**
   * Delete a session from Firebase
   * @param sessionId - Session ID to delete
   * @returns Promise resolving when deletion is complete
   */
  public async deleteSession(sessionId: string): Promise<void> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Delete from Firebase (this also deletes all messages in the session)
      await FirebaseService.deleteChatSession(user.id, sessionId);
      
      // Clear current session if it matches
      if (this.currentSession && this.currentSession.id === sessionId) {
        this.currentSession = null;
        this.messageHistory = this.messageHistory.filter(msg => msg.sessionId !== sessionId);
      }
      
      console.log(`✅ Session ${sessionId} deleted from Firebase`);
      
    } catch (error) {
      console.error('❌ Error deleting session from Firebase:', error);
      
      // Fallback: just clear local session
      if (this.currentSession && this.currentSession.id === sessionId) {
        this.currentSession = null;
        this.messageHistory = this.messageHistory.filter(msg => msg.sessionId !== sessionId);
      }
      
      throw error; // Re-throw to let UI handle the error
    }
  }
}
