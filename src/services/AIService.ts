/* cspell:disable */
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
      console.log('🚀 Sending message to backend...', message);

      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:4000' 
        : (process.env.REACT_APP_API_URL || 'https://taskflow-backend.vercel.app');

      // שלח ל-backend במקום ישירות ל-Claude
      const response = await fetch(`${apiUrl}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          userId: 'atiaron',
          context: context,
          chatHistory: chatHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error');
      }

      const data = await response.json();
      console.log('✅ Backend response received:', data);

      return {
        response: data.response,
        actions: data.actions || []
      };

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
    const actions: any[] = [];
    
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
      console.log('🚀 Generating task suggestions via backend...');

      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:4000' 
        : (process.env.REACT_APP_API_URL || 'https://taskflow-backend.vercel.app');

      const response = await fetch(`${apiUrl}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `בהתבסס על הקלט "${userInput}", הצע 3-5 משימות קונקרטיות. החזר רק רשימה של משימות, משימה אחת בכל שורה.`,
          userId: 'atiaron',
          context: { currentTasks: [] },
          chatHistory: []
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.response) {
        return data.response.split('\n')
          .filter((line: string) => line.trim())
          .map((line: string) => line.replace(/^[-•*]\s*/, ''));
      }
      
      return [];
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }
}