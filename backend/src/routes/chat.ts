import { Router, Request, Response } from 'express';
import { ClaudeService } from '../services/ClaudeService';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();
const claudeService = new ClaudeService();

interface ChatRequest {
  message: string;
  context?: {
    tasks?: any[];
    currentDate?: string;
  };
}

interface ChatResponse {
  message: string;
  suggestions?: {
    type: string;
    data: any;
  }[];
}

// POST /api/chat - Send message to AI
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { message, context }: ChatRequest = req.body;

  // Validate request
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw createError(400, 'Message is required and cannot be empty');
  }

  if (message.length > 4000) {
    throw createError(400, 'Message is too long. Maximum length is 4000 characters.');
  }

  try {
    // Get AI response
    const aiResponse = await claudeService.sendMessage(message, context);

    const response: ChatResponse = {
      message: aiResponse,
      suggestions: generateSuggestions(message, aiResponse)
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    
    if (error instanceof Error && error.message.includes('rate limit')) {
      throw createError(429, 'Too many requests. Please try again later.');
    }
    
    if (error instanceof Error && error.message.includes('API key')) {
      throw createError(503, 'AI service is temporarily unavailable. Please try again later.');
    }

    throw createError(500, 'Failed to process your request. Please try again.');
  }
}));

// Helper function to generate task suggestions based on AI response
function generateSuggestions(userMessage: string, aiResponse: string): any[] {
  const suggestions = [];

  // Simple pattern matching for common task-related requests
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = aiResponse.toLowerCase();

  if (lowerMessage.includes('create') || lowerMessage.includes('add')) {
    if (lowerResponse.includes('task') || lowerResponse.includes('deadline')) {
      suggestions.push({
        type: 'create_task',
        data: {
          suggested: true,
          priority: lowerMessage.includes('urgent') || lowerMessage.includes('important') ? 'high' : 'medium'
        }
      });
    }
  }

  if (lowerMessage.includes('prioritize') || lowerMessage.includes('organize')) {
    suggestions.push({
      type: 'organize_tasks',
      data: {
        action: 'review_priorities'
      }
    });
  }

  return suggestions;
}

export default router;