/* Enhanced AI Service with Tool Integration and Reasoning */
import { ChatMessage, AIContext, EnhancedAIResponse, ReasoningStep, ToolResult } from '../types';
import { toolRegistry, ToolContext } from './ToolRegistry';
import { TaskFlowMemorySystem } from './AdvancedMemoryService';

export class EnhancedAIService {
  private static memorySystem: TaskFlowMemorySystem | null = null;
  
  private static getMemorySystem(userId: string): TaskFlowMemorySystem {
    if (!this.memorySystem || this.memorySystem.currentUserId !== userId) {
      this.memorySystem = new TaskFlowMemorySystem(userId);
    }
    return this.memorySystem;
  }

  private static systemPrompt = `
אתה עוזר אישי חכם וידידותי שמתמחה בניהול משימות ותכנון יומי.

יכולות מתקדמות:
🛠️ כלים זמינים:
- task_management: יצירה, עדכון ומחיקת משימות
- search: חיפוש משימות מתקדם
- planning: תכנון יומי ושבועי
- analytics: ניתוח פרודקטיביות

🧠 שקיפות בחשיבה:
- הסבר את תהליך החשיבה שלך בצעדים ברורים
- הצג איך אתה בוחר כלים
- הסבר את הסיבות לפעולות שלך

התפקיד שלך:
1. להבין בקשות בטקסט טבעי ולהפוך אותן למשימות מובנות
2. לבחור את הכלים המתאימים ביותר לכל בקשה
3. לבצע פעולות באמצעות הכלים הזמינים
4. להציג תהליך חשיבה שקוף למשתמש
5. לתת המלצות חכמות מבוססות נתונים

כללי תגובה:
- תמיד ענה בעברית
- היה ידידותי וחם
- הצג את תהליך החשיבה שלך
- השתמש בכלים המתאימים
- הסבר את הפעולות שביצעת
`;

  static async sendMessageWithReasoning(
    message: string,
    context: AIContext,
    chatHistory: ChatMessage[]
  ): Promise<EnhancedAIResponse> {
    console.log('🚀 Enhanced AI processing message:', message);
    
    try {
      // Get memory system for this user
      const userId = context.userPreferences?.userId || 'default-user';
      const memorySystem = this.getMemorySystem(userId);
      
      // Store this interaction in memory
      await memorySystem.storeInteraction({
        type: 'chat_message',
        data: { message },
        context: {
          timeOfDay: new Date().getHours(),
          dayOfWeek: new Date().getDay(),
          tasksCount: context.currentTasks?.length || 0
        }
      });
      
      // Get relevant context from memory
      const memoryContext = await memorySystem.getRelevantContext(message);
      
      // Step 1: Analyze intent and reasoning
      const reasoning = await this.generateReasoning(message, context);
      console.log('🧠 Generated reasoning steps:', reasoning.length);
      
      // Step 2: Select optimal tools
      const selectedTools = await toolRegistry.selectOptimalTools(message, context);
      console.log('🛠️ Selected tools:', selectedTools.map(t => t.name));
      
      // Step 3: Prepare tool context
      const toolContext: ToolContext = {
        userId: context.userPreferences?.userId || 'default-user',
        tasks: context.currentTasks,
        user: context.userPreferences?.user,
        timestamp: new Date()
      };
      
      // Step 4: Execute tools and get results
      const toolResults: ToolResult[] = [];
      let aiResponse = '';
      
      if (selectedTools.length > 0) {
        // Extract parameters for tool execution
        const toolParams = this.extractToolParameters(message, selectedTools[0]);
        console.log('🔧 Extracted tool params:', toolParams);
        
        if (toolParams && Object.keys(toolParams).length > 0) {
          try {
            const result = await toolRegistry.executeTool(
              selectedTools[0].name,
              toolParams,
              toolContext
            );
            toolResults.push(result);
            
            aiResponse = this.generateResponseFromToolResult(result, reasoning);
          } catch (toolError) {
            console.error('❌ Tool execution error:', toolError);
            aiResponse = `מצטער, נתקלתי בבעיה בביצוע הפעולה: ${toolError instanceof Error ? toolError.message : 'שגיאה לא ידועה'}`;
          }
        } else {
          // No specific tool action needed, provide conversational response
          aiResponse = await this.generateConversationalResponse(message, context, reasoning);
        }
      } else {
        // No tools selected, provide conversational response
        aiResponse = await this.generateConversationalResponse(message, context, reasoning);
      }
      
      // Step 5: Return enhanced response
      return {
        response: aiResponse,
        reasoning: reasoning,
        toolResults: toolResults,
        confidence: this.calculateConfidence(toolResults, reasoning)
      };
      
    } catch (error) {
      console.error('❌ Enhanced AI Service Error:', error);
      
      return {
        response: "מצטער, נתקלתי בבעיה בעיבוד הבקשה שלך. אנא נסה שוב.",
        reasoning: [{
          type: "❌ שגיאה",
          content: "נתקלתי בבעיה טכנית",
          reasoning: "לא הצלחתי לעבד את הבקשה בגלל שגיאת מערכת"
        }],
        confidence: 0
      };
    }
  }

  private static async generateReasoning(
    message: string,
    context: AIContext
  ): Promise<ReasoningStep[]> {
    const steps: ReasoningStep[] = [];
    const intent = message.toLowerCase();
    
    // Step 1: Intent Analysis
    let intentAnalysis = "";
    if (intent.includes('יצור') || intent.includes('הוסף') || intent.includes('צור')) {
      intentAnalysis = "המשתמש רוצה ליצור משימה חדשה";
    } else if (intent.includes('חפש') || intent.includes('מצא') || intent.includes('איפה')) {
      intentAnalysis = "המשתמש רוצה לחפש משימות קיימות";
    } else if (intent.includes('תכנן') || intent.includes('ארגן') || intent.includes('תוכנית')) {
      intentAnalysis = "המשתמש רוצה לתכנן את המשימות שלו";
    } else if (intent.includes('ניתוח') || intent.includes('סטטיסטיקה') || intent.includes('פרודקטיביות')) {
      intentAnalysis = "המשתמש רוצה לראות ניתוח פרודקטיביות";
    } else {
      intentAnalysis = "המשתמש מבקש מידע כללי או עזרה";
    }
    
    steps.push({
      type: "🔍 ניתוח הבקשה",
      content: intentAnalysis,
      reasoning: "מבוסס על מילות מפתח בהודעת המשתמש",
      timestamp: new Date()
    });
    
    // Step 2: Context Analysis
    const contextAnalysis = `יש למשתמש ${context.currentTasks.length} משימות פעילות`;
    steps.push({
      type: "📊 ניתוח הקשר",
      content: contextAnalysis,
      reasoning: "מבוסס על מצב המשימות הנוכחי של המשתמש",
      timestamp: new Date()
    });
    
    // Step 3: Tool Selection Reasoning
    const toolAnalysis = this.analyzeToolNeed(intent);
    steps.push({
      type: "🛠️ בחירת כלים",
      content: toolAnalysis.content,
      reasoning: toolAnalysis.reasoning,
      timestamp: new Date()
    });
    
    return steps;
  }

  private static analyzeToolNeed(intent: string): { content: string; reasoning: string } {
    if (intent.includes('יצור') || intent.includes('הוסף') || intent.includes('צור')) {
      return {
        content: "בוחר בכלי ניהול משימות ליצירת משימה חדשה",
        reasoning: "הבקשה מכילה מילות מפתח המציינות יצירת משימה"
      };
    }
    
    if (intent.includes('חפש') || intent.includes('מצא') || intent.includes('איפה')) {
      return {
        content: "בוחר בכלי חיפוש למציאת משימות רלוונטיות",
        reasoning: "הבקשה מכילה מילות מפתח המציינות חיפוש"
      };
    }
    
    if (intent.includes('תכנן') || intent.includes('ארגן') || intent.includes('תוכנית')) {
      return {
        content: "בוחר בכלי תכנון ליצירת תוכנית עבודה",
        reasoning: "הבקשה מכילה מילות מפתח המציינות תכנון"
      };
    }
    
    if (intent.includes('ניתוח') || intent.includes('סטטיסטיקה') || intent.includes('פרודקטיביות')) {
      return {
        content: "בוחר בכלי ניתוח לבחינת הפרודקטיביות",
        reasoning: "הבקשה מכילה מילות מפתח המציינות ניתוח נתונים"
      };
    }
    
    return {
      content: "לא נדרש כלי ספציפי - תגובה שיחתית",
      reasoning: "הבקשה לא מכילה מילות מפתח המציינות פעולה ספציפית"
    };
  }

  private static extractToolParameters(message: string, tool: any): any {
    console.log('🔧 Extracting parameters for tool:', tool.name);
    
    const params: any = {};
    const messageLower = message.toLowerCase();
    
    if (tool.name === 'task_management') {
      // Extract task creation parameters
      if (messageLower.includes('יצור') || messageLower.includes('הוסף') || messageLower.includes('צור')) {
        params.action = 'create';
        
        // Extract title - look for patterns like "יצור משימה: [title]" or "הוסף: [title]"
        const titlePatterns = [
          /(?:יצור|הוסף|צור)\s*(?:משימה)?[:\s]*(.+)/i,
          /משימה[:\s]*(.+)/i,
          /^(.+)$/i // fallback - entire message as title
        ];
        
        for (const pattern of titlePatterns) {
          const match = message.match(pattern);
          if (match && match[1] && match[1].trim()) {
            params.title = match[1].trim();
            break;
          }
        }
        
        // Extract priority if mentioned
        if (messageLower.includes('דחוף') || messageLower.includes('חשוב') || messageLower.includes('גבוה')) {
          params.priority = 'high';
        } else if (messageLower.includes('רגיל') || messageLower.includes('בינוני')) {
          params.priority = 'medium';
        } else if (messageLower.includes('נמוך') || messageLower.includes('לא דחוף')) {
          params.priority = 'low';
        }
        
        // Extract due date if mentioned
        const datePatterns = [
          /עד\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
          /לתאריך\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
          /ב[\-\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
        ];
        
        for (const pattern of datePatterns) {
          const match = message.match(pattern);
          if (match && match[1]) {
            params.dueDate = match[1];
            break;
          }
        }
      }
    } else if (tool.name === 'search') {
      // Extract search query
      const searchPatterns = [
        /(?:חפש|מצא|איפה)\s*(?:משימות?)?[:\s]*(.+)/i,
        /(.+)/i // fallback
      ];
      
      for (const pattern of searchPatterns) {
        const match = message.match(pattern);
        if (match && match[1] && match[1].trim()) {
          params.query = match[1].trim();
          break;
        }
      }
    } else if (tool.name === 'planning') {
      if (messageLower.includes('שבוע') || messageLower.includes('שבועי')) {
        params.type = 'weekly';
      } else {
        params.type = 'daily';
      }
    } else if (tool.name === 'analytics') {
      if (messageLower.includes('דפוסים') || messageLower.includes('התנהגות')) {
        params.type = 'patterns';
      } else if (messageLower.includes('תובנות') || messageLower.includes('המלצות')) {
        params.type = 'insights';
      } else {
        params.type = 'productivity';
      }
    }
    
    console.log('🔧 Extracted params:', params);
    return params;
  }

  private static generateResponseFromToolResult(
    result: ToolResult,
    reasoning: ReasoningStep[]
  ): string {
    let response = result.message;
    
    if (result.success && result.data) {
      switch (result.type) {
        case 'create':
          response += `\n\n📝 פרטי המשימה:\n• כותרת: ${result.data.title}\n• עדיפות: ${result.data.priority}\n• נוצר: ${new Date(result.data.createdAt).toLocaleString('he-IL')}`;
          break;
          
        case 'search':
          if (Array.isArray(result.data) && result.data.length > 0) {
            response += `\n\n📋 תוצאות החיפוש:\n`;
            result.data.slice(0, 5).forEach((task: any, index: number) => {
              response += `${index + 1}. ${task.title} (${task.completed ? '✅ הושלם' : '⏳ בתהליך'})\n`;
            });
            if (result.data.length > 5) {
              response += `\n... ועוד ${result.data.length - 5} משימות`;
            }
          }
          break;
          
        case 'plan':
          if (result.data.type === 'daily') {
            response += `\n\n📅 סיכום התוכנית:\n`;
            response += `• משימות מתוכננות: ${result.data.scheduledTasks?.length || 0}\n`;
            response += `• משימות מוצעות: ${result.data.suggestedTasks?.length || 0}\n`;
            response += `• זמן משוער: ${Math.round((result.data.totalEstimatedTime || 0) / 60)} שעות\n`;
            
            if (result.data.recommendations && result.data.recommendations.length > 0) {
              response += `\n💡 המלצות:\n`;
              result.data.recommendations.forEach((rec: string) => {
                response += `• ${rec}\n`;
              });
            }
          } else if (result.data.type === 'weekly') {
            response += `\n\n📊 סיכום התוכנית השבועית:\n`;
            response += `• סך משימות: ${result.data.totalTasks}\n`;
            response += `• זמן משוער: ${result.data.estimatedHours} שעות\n`;
            response += `• עדיפות גבוהה: ${result.data.priorities?.high || 0}\n`;
          }
          break;
          
        case 'analyze':
          if (result.data.insights) {
            response += `\n\n💡 תובנות:\n`;
            result.data.insights.forEach((insight: string) => {
              response += `• ${insight}\n`;
            });
          } else if (result.data.completionRate !== undefined) {
            response += `\n\n📊 נתוני פרודקטיביות:\n`;
            response += `• שיעור השלמה: ${Math.round(result.data.completionRate)}%\n`;
            response += `• משימות הושלמו: ${result.data.completedTasks}\n`;
            response += `• משימות ממתינות: ${result.data.pendingTasks}\n`;
          }
          break;
      }
    }
    
    return response;
  }

  private static async generateConversationalResponse(
    message: string,
    context: AIContext,
    reasoning: ReasoningStep[]
  ): Promise<string> {
    // For now, provide a helpful conversational response
    // In the future, this could call the Claude API for more sophisticated responses
    
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('שלום') || messageLower.includes('היי') || messageLower.includes('בוקר')) {
      return `שלום! 👋 איך אוכל לעזור לך היום? יש לך ${context.currentTasks.length} משימות פעילות.`;
    }
    
    if (messageLower.includes('מה אני יכול') || messageLower.includes('עזרה') || messageLower.includes('מה אתה יכול')) {
      return `אני יכול לעזור לך עם:
🔸 יצירת משימות חדשות - פשוט תגיד "צור משימה: [שם המשימה]"
🔸 חיפוש משימות - "חפש [מילת מפתח]"
🔸 תכנון יומי ושבועי - "תכנן לי את היום" או "תכנן שבוע"
🔸 ניתוח פרודקטיביות - "איך אני מתקדם?" או "תן לי ניתוח"

מה בא לך לעשות?`;
    }
    
    if (messageLower.includes('תודה') || messageLower.includes('תשלם')) {
      return `על לא דבר! 😊 אני כאן כדי לעזור לך להיות יותר פרודקטיבי. יש עוד משהו שאוכל לעזור בו?`;
    }
    
    // Default response for unclear requests
    return `אני לא בטוח שהבנתי מה אתה רוצה שאעשה. אוכל לעזור לך עם:
• יצירת משימות - "צור משימה: [שם]"
• חיפוש משימות - "חפש [מילה]"
• תכנון - "תכנן לי את היום"
• ניתוח - "איך אני מתקדם?"

תוכל לנסח את הבקשה שלך יותר ספציפית?`;
  }

  private static calculateConfidence(
    toolResults: ToolResult[],
    reasoning: ReasoningStep[]
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on successful tool execution
    if (toolResults.length > 0 && toolResults.every(r => r.success)) {
      confidence += 0.3;
    }
    
    // Increase confidence based on reasoning quality
    if (reasoning.length >= 3) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  // Backward compatibility method
  static async sendMessage(
    message: string,
    context: AIContext,
    chatHistory: ChatMessage[]
  ): Promise<{
    response: string;
    actions?: {
      type: 'create_task' | 'update_task' | 'delete_task';
      data: any;
    }[];
  }> {
    try {
      const enhancedResponse = await this.sendMessageWithReasoning(message, context, chatHistory);
      
      // Convert tool results to legacy actions format
      const actions = enhancedResponse.toolResults?.map(result => ({
        type: result.type === 'create' ? 'create_task' as const : 
              result.type === 'update' ? 'update_task' as const :
              result.type === 'delete' ? 'delete_task' as const : 'create_task' as const,
        data: result.data
      })) || [];
      
      return {
        response: enhancedResponse.response,
        actions: actions.length > 0 ? actions : undefined
      };
    } catch (error) {
      console.error('❌ Enhanced AI Service Error (compatibility mode):', error);
      return {
        response: "מצטער, נתקלתי בבעיה. אנא נסה שוב."
      };
    }
  }
}

// Export both for flexibility
export { EnhancedAIService as AIService };
