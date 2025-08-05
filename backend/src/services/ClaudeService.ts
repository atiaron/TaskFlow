import Anthropic from '@anthropic-ai/sdk';

export class ClaudeService {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY not found. Using mock responses.');
      this.anthropic = null as any;
    } else {
      this.anthropic = new Anthropic({
        apiKey: apiKey,
      });
    }
  }

  async sendMessage(message: string, context?: any): Promise<string> {
    // If no API key, return mock response
    if (!this.anthropic) {
      return this.getMockResponse(message);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }

      return 'I apologize, but I encountered an issue processing your request. Please try again.';

    } catch (error) {
      console.error('Error calling Claude API:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('rate_limit')) {
          throw new Error('rate limit exceeded');
        }
        if (error.message.includes('authentication')) {
          throw new Error('API key authentication failed');
        }
      }

      // Fallback to mock response on error
      return this.getMockResponse(message);
    }
  }

  private buildSystemPrompt(context?: any): string {
    const basePrompt = `You are TaskFlow AI, a helpful assistant for task management and productivity. 

Your role is to:
- Help users organize and prioritize their tasks
- Provide productivity tips and suggestions
- Assist with breaking down complex projects into manageable tasks
- Suggest time management strategies
- Help with deadline planning and scheduling

Guidelines:
- Be concise but helpful
- Focus on actionable advice
- Use a friendly, encouraging tone
- If asked about task creation, provide specific, actionable task suggestions
- Consider task priorities (high, medium, low) in your recommendations
- Help users think about deadlines and time management

Keep responses under 200 words unless specifically asked for detailed explanations.`;

    if (context?.tasks && context.tasks.length > 0) {
      const taskSummary = this.summarizeTasks(context.tasks);
      return `${basePrompt}\n\nCurrent task context:\n${taskSummary}`;
    }

    if (context?.currentDate) {
      return `${basePrompt}\n\nCurrent date: ${context.currentDate}`;
    }

    return basePrompt;
  }

  private summarizeTasks(tasks: any[]): string {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const highPriorityTasks = tasks.filter(t => !t.completed && t.priority === 'high').length;

    return `You have ${totalTasks} total tasks: ${completedTasks} completed, ${pendingTasks} pending. ${highPriorityTasks} high-priority tasks need attention.`;
  }

  private getMockResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm here to help you manage your tasks and boost your productivity. How can I assist you today?";
    }

    if (lowerMessage.includes('prioritize') || lowerMessage.includes('priority')) {
      return "To prioritize effectively, I recommend:\n\n• Use the Eisenhower Matrix: urgent/important quadrants\n• Focus on high-impact tasks first\n• Consider deadlines and dependencies\n• Break large tasks into smaller, manageable pieces\n\nWould you like help organizing your current tasks?";
    }

    if (lowerMessage.includes('schedule') || lowerMessage.includes('plan')) {
      return "For effective scheduling:\n\n• Time-block your calendar for important tasks\n• Leave buffer time between activities\n• Schedule demanding work during your peak energy hours\n• Use the 2-minute rule: do quick tasks immediately\n\nWhat specific scheduling challenge can I help you with?";
    }

    if (lowerMessage.includes('productivity') || lowerMessage.includes('focus')) {
      return "Here are some proven productivity techniques:\n\n• Pomodoro Technique: 25-minute focused work sessions\n• Deep work blocks for complex tasks\n• Eliminate distractions during focus time\n• Use task batching for similar activities\n\nWhich area would you like to improve?";
    }

    if (lowerMessage.includes('deadline') || lowerMessage.includes('due')) {
      return "For deadline management:\n\n• Work backwards from the due date\n• Break the project into milestones\n• Add buffer time for unexpected issues\n• Set reminders at key intervals\n\nDo you have a specific deadline you need help planning for?";
    }

    return "I'm here to help you with task management, prioritization, and productivity. You can ask me about:\n\n• Organizing and prioritizing tasks\n• Time management strategies\n• Breaking down complex projects\n• Setting up productive routines\n\nWhat would you like to work on?";
  }
}