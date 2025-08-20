import AuthService from './AuthService';

/**
 * ChatService - Service for handling chat operations
 * Manages API communication with the chat backend
 */
class ChatService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.endpoints = {
      sendMessage: '/chat/send',
      claudeMessage: '/claude'
    };
  }

  /**
   * Send a message to the chat API
   * @param {string} message - The message to send
   * @param {Array} chatHistory - Previous messages in the conversation
   * @param {Object} context - Context information (tasks, etc.)
   * @returns {Promise} Response from the API
   */
  async sendMessage(message, chatHistory = [], context = {}) {
    try {
      const token = AuthService.getToken();
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const userId = AuthService.isAuthenticated() ? 
        JSON.parse(localStorage.getItem('user'))?.uid : 
        'guest';

      const response = await fetch(`${this.baseUrl}${this.endpoints.sendMessage}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          userId,
          chatHistory,
          context
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  }

  /**
   * Send a message directly to Claude API
   * @param {Array} messages - Array of message objects with role and content
   * @param {string} system - Optional system prompt
   * @param {boolean} enableFunctionCalling - Whether to enable function calling
   * @returns {Promise} Response from the Claude API
   */
  async sendToClaudeDirectly(messages, system = null, enableFunctionCalling = false) {
    try {
      const token = AuthService.getToken();
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${this.endpoints.claudeMessage}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages,
          system,
          enableFunctionCalling
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to communicate with Claude');
      }

      return await response.json();
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * Format a chat message for display
   * @param {string} text - Message text content
   * @param {string} sender - Sender type ('user' or 'bot')
   * @returns {Object} Formatted message object
   */
  formatMessage(text, sender = 'bot') {
    return {
      id: Date.now(),
      sender,
      text,
      timestamp: new Date()
    };
  }
}

export default new ChatService();