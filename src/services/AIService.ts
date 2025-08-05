import { ChatMessage, AIContext } from '../types';

export class AIService {
  private static systemPrompt = `
אתה עוזר אישי חכם וידידותי שמתמחה בניהול משימות ותכנון יומי.

התפקיד שלך:
1. להבין בקשות בטקסט טבעי ולהפוך אותן למשימות מובנות
2. לשאול שאלות חכמות כדי לקבל פרטים נוספים
3. ליצור תת-משימות כשצריך
4. לתכנן לוחות זמנים ריאליים
5. להציע שיפורים ואופטימיזציות

כללי תגובה:
- תמיד ענה בעברית
- היה ידידותי וחם
- שאל שאלות ספציפיות
- הציע פתרונות מעשיים
- זכור את ההקשר מהשיחות הקודמות

יכולות טכניות:
- אתה יכול ליצור, לערוך ולמחוק משימות
- אתה יכול לראות את כל המשימות הקיימות
- אתה יכול לתכנן לוחות זמנים
- אתה יכול ליצור תת-משימות
`;

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
      const contextMessage = this.buildContextMessage(context);
      const historyMessages = this.buildHistoryMessages(chatHistory);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_CLAUDE_API_KEY || 'temp-key',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1024,
          messages: [
            { role: "assistant", content: contextMessage },
            ...historyMessages,
            { role: "user", content: message }
          ],
          system: this.systemPrompt
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0];
      
      if (content && content.type === 'text') {
        return {
          response: content.text,
          actions: this.extractActions(content.text)
        };
      }

      return { response: "מצטער, לא הצלחתי להבין את הבקשה." };

    } catch (error) {
      console.error('AI Service Error:', error);
      
      // הודעת שגיאה ידידותית למשתמש
      return { 
        response: "מצטער, יש לי בעיות נכונות. אוקיי נסה שוב מאוחר יותר." 
      };
    }
  }

  private static buildContextMessage(context: AIContext): string {
    const tasksInfo = context.currentTasks.length > 0 
      ? `משימות קיימות:\n${context.currentTasks.map(t => 
          `- ${t.title} (${t.completed ? 'הושלם' : 'בתהליך'})`
        ).join('\n')}`
      : 'אין משימות קיימות';

    return `הקשר נוכחי:
${tasksInfo}

זמן נוכחי: ${context.currentTime.toLocaleString('he-IL')}
העדפות משתמש: ${JSON.stringify(context.userPreferences)}`;
  }

  private static buildHistoryMessages(history: ChatMessage[]): any[] {
    return history.slice(-10).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }

  private static extractActions(response: string): any[] {
    const actions: any[] = = [];
    
    const createTaskRegex = /יוצר משימה:\s*(.+)/g;
    let match;
    while ((match = createTaskRegex.exec(response)) !== null) {
      actions.push({
        type: 'create_task',
        data: {
          title: match[1].trim(),
          priority: 'medium',
          completed: false
        }
      });
    }

    return actions;
  }

  static async generateTaskSuggestions(userInput: string): Promise<string[]> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_CLAUDE_API_KEY || 'temp-key',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 512,
          messages: [{
            role: "user",
            content: `בהתבסס על הקלט "${userInput}", הצע 3-5 משימות קונקרטיות. החזר רק רשימה של משימות, משימה אחת בכל שורה.`
          }],
          system: "אתה עוזר שמציע משימות קונקרטיות. ענה בעברית ובפורמט של רשימה פשוטה."
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0];
      
      if (content && content.type === 'text') {
        return content.text.split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•*]\s*/, ''));
      }
      
      return [];
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }
}