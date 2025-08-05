import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
  Fab,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ChatMessage } from '../types';
import { aiService } from '../services/AdvancedAIService';
import { useAuth } from '../contexts/AuthContext';

const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await aiService.getChatHistory();
        setMessages(history);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();

    // Add welcome message if no history
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        text: `Hello ${user?.displayName || 'there'}! I'm your AI assistant. I can help you manage your tasks, set priorities, and stay organized. How can I assist you today?`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setNewMessage('');
    setLoading(true);
    setError(null);

    try {
      const response = await aiService.sendMessage({
        message: newMessage.trim(),
        context: {
          currentDate: new Date()
        }
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'ai',
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      await aiService.saveChatHistory(finalMessages);

    } catch (error) {
      setError('Failed to get AI response. Please try again.');
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = async () => {
    setMessages([]);
    await aiService.saveChatHistory([]);
  };

  const quickSuggestions = [
    "Help me prioritize my tasks",
    "Create a daily schedule",
    "What should I focus on today?",
    "Organize my tasks by project"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setNewMessage(suggestion);
  };

  return (
    <Box
      sx={{
        height: 'calc(100vh - 70px)',
        display: 'flex',
        flexDirection: 'column',
        pb: isMobile ? 1 : 0
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <AIIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              AI Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your smart task management helper
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={clearChat} size="small">
          <RefreshIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 1
            }}
          >
            <Box
              sx={{
                maxWidth: '70%',
                display: 'flex',
                flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 1
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: message.sender === 'user' ? 'secondary.main' : 'primary.main'
                }}
              >
                {message.sender === 'user' ? <PersonIcon /> : <AIIcon />}
              </Avatar>
              
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: message.sender === 'user' 
                    ? 'primary.main' 
                    : 'background.paper',
                  color: message.sender === 'user' 
                    ? 'primary.contrastText' 
                    : 'text.primary',
                  borderRadius: 2,
                  border: message.sender === 'ai' ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{
                    __html: message.sender === 'ai' 
                      ? aiService.formatAIResponse(message.text)
                      : message.text
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.7,
                    fontSize: '0.7rem'
                  }}
                >
                  {format(message.timestamp, 'HH:mm')}
                </Typography>
              </Paper>
            </Box>
          </Box>
        ))}
        
        {loading && (
          <Box display="flex" justifyContent="flex-start" mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                <AIIcon />
              </Avatar>
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <CircularProgress size={16} />
              </Paper>
            </Box>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Quick Suggestions */}
      {messages.length <= 1 && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Quick suggestions:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {quickSuggestions.map((suggestion) => (
              <Chip
                key={suggestion}
                label={suggestion}
                variant="outlined"
                size="small"
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          alignItems: 'flex-end'
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask me anything about your tasks..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          variant="outlined"
          size="small"
        />
        <Fab
          size="small"
          color="primary"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || loading}
          sx={{ minWidth: 48, width: 48, height: 48 }}
        >
          <SendIcon />
        </Fab>
      </Box>
    </Box>
  );
};

export default ChatInterface;