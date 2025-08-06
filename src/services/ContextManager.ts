/**
 * ContextManager - Smart Context Window Management
 * מסמך מקור: SYSTEM_DESIGN_AND_IMPROVEMENTS_2025.md
 * תאריך יצירה: 6 באוגוסט 2025
 * 
 * ניהול חכם של context window של Claude:
 * - Token counting ואומדן
 * - Automatic summarization
 * - Context compression
 * - Recent messages preservation
 */

import { ChatMessage } from '../types';
import { EnhancedClaudeService } from './EnhancedClaudeService';

export interface ContextResult {
  context: string;
  needsSummary: boolean;
  tokenCount: number;
  summaryGenerated?: boolean;
}

export interface ContextConfig {
  maxTokens: number;
  summaryTrigger: number;
  recentMessagesKeep: number;
  estimationRatio: number;
}

export class ContextManager {
  private static readonly DEFAULT_CONFIG: ContextConfig = {
    maxTokens: 150000,        // Safe buffer from Claude's 200K limit
    summaryTrigger: 120000,   // Start summarizing at 120K tokens
    recentMessagesKeep: 10,   // Always keep last 10 messages
    estimationRatio: 4        // 1 token ≈ 4 characters (rough estimation)
  };

  private static config: ContextConfig = { ...this.DEFAULT_CONFIG };

  // ✅ MAIN CONTEXT MANAGEMENT
  static async manageContext(
    messages: ChatMessage[],
    currentContext: string = '',
    customConfig?: Partial<ContextConfig>
  ): Promise<ContextResult> {
    try {
      // Apply custom config if provided
      const activeConfig = customConfig 
        ? { ...this.config, ...customConfig }
        : this.config;

      const tokenCount = this.estimateTokens(messages, activeConfig.estimationRatio);
      
      console.log(`🧠 Context Management - Token count: ${tokenCount}`);

      if (tokenCount > activeConfig.summaryTrigger) {
        console.log('🔄 Token limit reached, creating summary...');
        
        const summary = await this.createContextSummary(messages, activeConfig);
        
        // Keep only recent messages + summary
        const recentMessages = messages.slice(-activeConfig.recentMessagesKeep);
        const contextWithSummary = this.buildContextWithSummary(summary, recentMessages);
        
        return {
          context: contextWithSummary,
          needsSummary: true,
          tokenCount: this.estimateTokens([...this.parseContextToMessages(summary), ...recentMessages]),
          summaryGenerated: true
        };
      }
      
      return {
        context: this.formatMessages(messages),
        needsSummary: false,
        tokenCount,
        summaryGenerated: false
      };
    } catch (error) {
      console.error('❌ Error in context management:', error);
      
      // Fallback: use recent messages only
      const recentMessages = messages.slice(-this.config.recentMessagesKeep);
      return {
        context: this.formatMessages(recentMessages),
        needsSummary: false,
        tokenCount: this.estimateTokens(recentMessages),
        summaryGenerated: false
      };
    }
  }

  // ✅ CONTEXT SUMMARIZATION
  private static async createContextSummary(
    messages: ChatMessage[],
    config: ContextConfig
  ): Promise<string> {
    try {
      // Don't summarize recent messages - they stay as-is
      const messagesToSummarize = messages.slice(0, -config.recentMessagesKeep);
      
      if (messagesToSummarize.length === 0) {
        return 'אין הקשר קודם לסיכום';
      }

      const conversationText = messagesToSummarize
        .map(msg => `${msg.sender === 'user' ? 'משתמש' : 'עוזר'}: ${msg.content}`)
        .join('\n');

      const summaryPrompt = `סכם את השיחה הבאה בצורה קצרה ומפורטת:

📋 **מה לכלול בסיכום:**
- מה המשתמש ביקש/רצה להשיג?
- איזה משימות או החלטות נקבעו?
- מה המצב הנוכחי של הפרויקט?
- איזה בעיות טכניות נפתרו?
- העדפות והגדרות חשובות

⚡ **פורמט הסיכום:**
רק מידע חיוני ורלוונטי להמשך השיחה. 
השתמש בעברית קצרה וברורה.

השיחה לסיכום:
${conversationText}

סיכום השיחה:`;

      // Use Claude to create summary
      const claudeService = EnhancedClaudeService.getInstance();
      const response = await claudeService.sendMessage(summaryPrompt);
      
      if (!response.success || !response.content) {
        throw new Error(`Claude response failed: ${response.error?.message || 'Unknown error'}`);
      }
      
      console.log('✅ Context summary created successfully');
      return response.content;
    } catch (error) {
      console.error('❌ Error creating context summary:', error);
      
      // Fallback summary
      return `סיכום אוטומטי: שיחה של ${messages.length} הודעות. הקשר מלא לא זמין עקב שגיאה טכנית.`;
    }
  }

  // ✅ TOKEN ESTIMATION
  private static estimateTokens(
    messages: ChatMessage[], 
    estimationRatio: number = 4
  ): number {
    // Rough estimation: 1 token ≈ 4 characters for Hebrew/English mixed content
    const totalChars = messages.reduce((sum, msg) => {
      return sum + msg.content.length + (msg.sender?.length || 0) + 10; // +10 for metadata
    }, 0);
    
    return Math.ceil(totalChars / estimationRatio);
  }

  // ✅ CONTEXT FORMATTING
  private static formatMessages(messages: ChatMessage[]): string {
    return messages
      .map(msg => {
        const sender = msg.sender === 'user' ? 'משתמש' : 'עוזר';
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('he-IL') : '';
        return `[${timestamp}] ${sender}: ${msg.content}`;
      })
      .join('\n\n');
  }

  private static buildContextWithSummary(summary: string, recentMessages: ChatMessage[]): string {
    const formattedRecent = this.formatMessages(recentMessages);
    
    return `📚 **סיכום השיחה הקודמת:**
${summary}

${'='.repeat(50)}

🕒 **הודעות אחרונות:**
${formattedRecent}`;
  }

  // ✅ UTILITY METHODS
  private static parseContextToMessages(summary: string): ChatMessage[] {
    // Create a virtual message for token counting
    return [{
      id: 'summary',
      content: summary,
      sender: 'ai' as const, // Use 'ai' instead of 'system'
      timestamp: new Date(),
      type: 'text' as const
    }];
  }

  static updateConfig(newConfig: Partial<ContextConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Context Manager config updated:', this.config);
  }

  static getConfig(): ContextConfig {
    return { ...this.config };
  }

  static resetConfig(): void {
    this.config = { ...this.DEFAULT_CONFIG };
    console.log('🔄 Context Manager config reset to defaults');
  }

  // ✅ CONTEXT VALIDATION
  static validateContext(context: string): boolean {
    const tokenCount = this.estimateTokens([{
      id: 'test',
      content: context,
      sender: 'ai', // Use 'ai' instead of 'system'
      timestamp: new Date(),
      type: 'text'
    }]);

    return tokenCount <= this.config.maxTokens;
  }

  // ✅ EMERGENCY CONTEXT COMPRESSION
  static async emergencyCompress(messages: ChatMessage[]): Promise<string> {
    console.log('🚨 Emergency context compression triggered');
    
    // Keep only last 5 messages in emergency
    const emergency = messages.slice(-5);
    return this.formatMessages(emergency);
  }
}
