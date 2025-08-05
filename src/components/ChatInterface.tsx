import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  IconButton,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Fab,
  List,
  ListItem,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as UserIcon,
  Add as AddIcon,
  AutoAwesome as MagicIcon
} from '@mui/icons-material';
import { ChatMessage, ChatSession, Task, User } from '../types';
import { AIService } from '../services/AIService';
import { StorageService } from '../services/StorageService';

interface ChatInterfaceProps {
  user: User;
  onTasksUpdate: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onTasksUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
    loadTasks();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      let session = await StorageService.getActiveChatSession();
      
      if (!session) {
        const sessionId = await StorageService.addChatSession({
          title: 'צ\'אט חדש',
          messages: [{
            id: crypto.randomUUID(),
            content: `שלום ${user.name}! 👋\n\nאני העוזר החכם שלך לניהול משימות. אני כאן כדי לעזור לך:\n\n• ליצור משימות חדשות\n• לתכנן את היום שלך\n• לארגן פרויקטים\n• לתת עצות והמלצות\n\nפשוט כתב לי מה אתה צריך לעשות ואני אעזור לך לתכנן את זה! 🚀`,
            sender: 'ai',
            timestamp: new Date(),
            type: 'text'
          }],
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        });
        
        session = {
          id: sessionId,
          title: 'צ\'אט חדש',
          messages: [{
            id: crypto.randomUUID(),
            content: `שלום ${user.name}! 👋\n\nאני העוזר החכם שלך לניהול משימות. אני כאן כדי לעזור לך:\n\n• ליצור משימות חדשות\n• לתכנן את היום שלך\n• לארגן פרויקטים\n• לתת עצות והמלצות\n\nפשוט כתב לי מה אתה צריך לעשות ואני אעזור לך לתכנן את זה! 🚀`,
            sender: 'ai',
            timestamp: new Date(),
            type: 'text'
          }],
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        };
      }
      
      setCurrentSession(session);
      setMessages(session.messages);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const tasksData = await StorageService.getAllTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || !currentSession) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: inputText,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const context = {
        currentTasks: tasks,
        recentChats: [],
        userPreferences: user.settings,
        currentTime: new Date()
      };

      const response = await AIService.sendMessage(inputText, context, messages);
      
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: response.response,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);

      // Handle actions (like creating tasks)
      if (response.actions) {
        console.log('🎯 Processing actions:', response.actions);
        for (const action of response.actions) {
          if (action.type === 'create_task') {
            console.log('✅ Creating task:', action.data);
            await StorageService.addTask({
              ...action.data,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            await loadTasks();
            onTasksUpdate();
            console.log('✅ Task created and lists updated!');
          }
        }
      }

      // Update session
      await StorageService.updateChatSession(currentSession.id, {
        messages: finalMessages,
        title: finalMessages.length > 2 ? userMessage.content.slice(0, 30) + '...' : 'צ\'אט חדש'
      });

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: 'מצטער, יש לי בעיה טכנית כרגע. אנא נסה שוב מאוחר יותר.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedPrompts = [
    "צריך לתכנן את השבוע הקרוב",
    "רוצה לארגן פגישה חשובה",
    "עזור לי לתכנן פרויקט חדש",
    "איך אני יכול לשפר את הפרודקטיביות?"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
  };

  return (
    <Container sx={{ height: '100vh', display: 'flex', flexDirection: 'column', pt: 2, pb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="secondary" />
          AI עוזר חכם
        </Typography>
        <Typography variant="body2" color="text.secondary">
          כתב לי מה אתה צריך לעשות ואני אעזור לך לתכנן את זה
        </Typography>
      </Box>

      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
        <List>
          {messages.map((message, index) => (
            <ListItem key={message.id} sx={{ flexDirection: 'column', alignItems: 'stretch', p: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 1
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    maxWidth: '80%',
                    flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main'
                    }}
                  >
                    {message.sender === 'user' ? <UserIcon /> : <AIIcon />}
                  </Avatar>
                  
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
                      color: message.sender === 'user' ? 'white' : 'text.primary',
                      borderRadius: 2,
                      borderTopRightRadius: message.sender === 'user' ? 0 : 2,
                      borderTopLeftRadius: message.sender === 'user' ? 2 : 0,
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 1,
                        opacity: 0.7,
                        textAlign: message.sender === 'user' ? 'left' : 'right'
                      }}
                    >
                      {message.timestamp.toLocaleTimeString('he-IL', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            </ListItem>
          ))}
          
          {isLoading && (
            <ListItem sx={{ justifyContent: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  <AIIcon />
                </Avatar>
                <Paper sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2, borderTopLeftRadius: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2">חושב...</Typography>
                  </Box>
                </Paper>
              </Box>
            </ListItem>
          )}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            הצעות לשיחה:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {suggestedPrompts.map((prompt, index) => (
              <Chip
                key={index}
                label={prompt}
                onClick={() => handleSuggestionClick(prompt)}
                variant="outlined"
                size="small"
                icon={<MagicIcon />}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Input */}
      <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="כתב לי מה אתה צריך לעשות..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            color="primary"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'grey.300' }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Container>
  );
};

export default ChatInterface;