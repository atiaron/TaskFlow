import { AIRequest, AIResponse, ChatMessage } from '../types';

class AdvancedAIService {
  private apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  async sendMessage(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message to AI:', error);
      throw error;
    }
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    // This would typically be stored in localStorage or Firebase
    const history = localStorage.getItem('chatHistory');
    return history ? JSON.parse(history) : [];
  }

  async saveChatHistory(messages: ChatMessage[]): Promise<void> {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }

  generateTaskSuggestions(message: string): string[] {
    const suggestions = [];
    
    // Simple keyword-based suggestions
    if (message.toLowerCase().includes('meeting')) {
      suggestions.push('Schedule meeting preparation');
      suggestions.push('Send meeting agenda');
    }
    
    if (message.toLowerCase().includes('deadline')) {
      suggestions.push('Review upcoming deadlines');
      suggestions.push('Set reminder for deadline');
    }
    
    if (message.toLowerCase().includes('project')) {
      suggestions.push('Break down project into tasks');
      suggestions.push('Set project milestones');
    }
    
    return suggestions;
  }

  formatAIResponse(response: string): string {
    // Basic formatting for AI responses
    return response
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
}

export const aiService = new AdvancedAIService();