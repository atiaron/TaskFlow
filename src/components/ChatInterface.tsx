/**
 * ChatInterface Component - Enhanced Version
 * 
 * Purpose: Main chat interface for interacting with Claude AI
 * Features: Progressive loading, error recovery, mobile-first design,
 * real-time security scanning, task creation integration
 * 
 * Based on: SYSTEM_DESIGN_AND_IMPROVEMENTS_2025.md
 * - Progressive Loading Strategy (lines 1008-1030)
 * - Error Recovery & User Guidance (lines 1040-1100) 
 * - Mobile-First Strategy (lines 1100-1150)
 * - Zero Friction UX Philosophy (lines 990-1000)
 * 
 * Dependencies: EnhancedClaudeService, SecurityManager, types
 * Usage: Primary interface for all AI interactions
 * 
 * @author TaskFlow Development Team
 * @version 2.0.0 - Enhanced with new architecture
 * @date 2025-08-06
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Avatar,
  Chip,
  Fab,
  Collapse,
  Alert,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  Psychology as AIIcon,
  Person as PersonIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  Stop,
  Refresh,
  ContentCopy,
  TaskAlt,
  WarningAmber,
  WifiOff
} from '@mui/icons-material';
import { EnhancedClaudeService } from '../services/EnhancedClaudeService';
import { AuthService } from '../services/AuthService';
import { StorageService } from '../services/StorageService';
import { PerformanceMonitor } from '../services/PerformanceMonitor';
import { RealTimeSyncService } from '../services/RealTimeSyncService';
import { ReasoningDisplay } from './ReasoningDisplay';
import type { 
  LoadingStates
} from '../types/index';

// Define missing types locally for compatibility
interface ReasoningStep {
  step: string;
  reasoning: string;
  confidence: number;
}

interface ToolResult {
  type: string;
  success: boolean;
  data?: any;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  status: 'active' | 'archived' | 'deleted';
  userId: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  reasoning?: ReasoningStep[];
  toolResults?: ToolResult[];
  actions?: {
    type: 'create_task' | 'update_task' | 'delete_task';
    data: any;
  }[];
  status?: 'sending' | 'sent' | 'error';
  securityWarnings?: string[];
}

interface TaskAction {
  type: 'task_created' | 'task_suggestion';
  data: any;
  label: string;
}

interface ChatInterfaceProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  user?: any;
  onTasksUpdate?: () => void;
  sessionId?: string;
  onSessionChange?: (session: ChatSession) => void;
  onTaskCreated?: (task: any) => void;
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  isMinimized = false, 
  onToggleMinimize,
  user: propsUser,
  onTasksUpdate,
  sessionId,
  onSessionChange,
  onTaskCreated,
  className
}) => {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingState, setLoadingState] = useState<{ status: string; message?: string }>({ status: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [costAlert, setCostAlert] = useState<{ show: boolean; cost: number; limit: number }>({ 
    show: false, cost: 0, limit: 0 
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const claudeService = useRef(EnhancedClaudeService.getInstance());
  const lastSentTime = useRef<number>(0);
  
  // Legacy state for compatibility
  const [user, setUser] = useState(propsUser || AuthService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(false);

  // Constants
  const MESSAGE_THROTTLE_MS = 1000;
  const MAX_INPUT_LENGTH = 2000;
  const AUTO_SCROLL_THRESHOLD = 100;

  /**
   * Initialize component and event listeners
   */
  useEffect(() => {
    initializeChat();
    setupEventListeners();
    
    // Set up real-time message sync if sessionId exists
    let messageUnsubscribe: (() => void) | undefined;
    
    if (sessionId) {
      const syncService = RealTimeSyncService.getInstance();
      messageUnsubscribe = syncService.subscribeToMessages(sessionId, (updatedMessages) => {
        // Convert ChatMessage to legacy Message format
        const legacyMessages: Message[] = updatedMessages.map(msg => ({
          id: msg.id,
          text: msg.content,
          sender: msg.sender as 'user' | 'ai',
          timestamp: msg.timestamp,
          status: 'sent'
        }));
        
        setMessages(legacyMessages);
      });
    }
    
    return () => {
      cleanup();
      messageUnsubscribe?.();
    };
  }, [sessionId]);

  /**
   * Legacy auth state listener
   */
  useEffect(() => {
    if (!propsUser) {
      const unsubscribe = AuthService.onAuthStateChanged(setUser);
      return unsubscribe;
    }
  }, [propsUser]);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    const shouldAutoScroll = () => {
      if (!messagesEndRef.current) return false;
      
      const container = messagesEndRef.current.parentElement;
      if (!container) return false;
      
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < AUTO_SCROLL_THRESHOLD;
      return isNearBottom;
    };

    if (shouldAutoScroll()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingState]);

  /**
   * Initialize chat session and load history
   */
  const initializeChat = useCallback(async () => {
    try {
      // Create or switch to session
      let session: ChatSession;
      if (sessionId) {
        await claudeService.current.switchToSession(sessionId);
        session = claudeService.current.getCurrentSession()!;
      } else {
        session = await claudeService.current.createSession('שיחה חדשה');
      }

      // Load message history and convert to legacy format
      const history = claudeService.current.getSessionHistory(session.id);
      const legacyMessages: Message[] = history.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.role as 'user' | 'ai',
        timestamp: msg.timestamp,
        status: 'sent'
      }));

      setMessages(legacyMessages);
      onSessionChange?.(session);

      // Auto-focus input on desktop
      if (window.innerWidth > 768) {
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setError('שגיאה בטעינת השיחה');
    }
  }, [sessionId, onSessionChange]);

  /**
   * Setup event listeners for Claude service and browser events
   */
  const setupEventListeners = useCallback(() => {
    // Claude loading state changes
    const handleLoadingState = (event: CustomEvent) => {
      const state = event.detail;
      setLoadingState(state);
      setIsLoading(state.status !== 'idle');
    };

    // Cost warnings
    const handleCostWarning = (event: CustomEvent) => {
      const { current, limit } = event.detail;
      setCostAlert({ show: true, cost: current, limit });
      setTimeout(() => setCostAlert(prev => ({ ...prev, show: false })), 5000);
    };

    // Claude errors
    const handleClaudeError = (event: CustomEvent) => {
      const { userMessage } = event.detail;
      setError(userMessage);
      setLoadingState({ status: 'idle' });
      setIsLoading(false);
    };

    // Network status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Add event listeners
    window.addEventListener('claude-loading-state', handleLoadingState as EventListener);
    window.addEventListener('cost-warning', handleCostWarning as EventListener);
    window.addEventListener('claude-error', handleClaudeError as EventListener);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('claude-loading-state', handleLoadingState as EventListener);
      window.removeEventListener('cost-warning', handleCostWarning as EventListener);
      window.removeEventListener('claude-error', handleClaudeError as EventListener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    // Save draft message to localStorage
    if (inputText.trim()) {
      localStorage.setItem('taskflow_chat_draft', inputText);
    }
  }, [inputText]);

  /**
   * Handle sending message to Claude with enhanced architecture
   */
  const handleSendMessage = async () => {
    return PerformanceMonitor.time(
      'saveMessage',
      async () => {
        const trimmedInput = inputText.trim();
        if (!trimmedInput || loadingState.status !== 'idle') return;

        // Throttle messages
        const now = Date.now();
        if (now - lastSentTime.current < MESSAGE_THROTTLE_MS) {
          setError('⏰ רגע, עדיין שולח...');
          setTimeout(() => setError(null), 2000);
          return;
        }
        lastSentTime.current = now;

        // Create user message in legacy format
        const userMessage: Message = {
          id: `msg_${Date.now()}_user`,
          text: trimmedInput,
          sender: 'user',
          timestamp: new Date(),
          status: 'sending'
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setError(null);
        setIsLoading(true);

        try {
          // Send to Claude using new architecture
          const session = claudeService.current.getCurrentSession();
      const response = await claudeService.current.sendMessage(
        trimmedInput,
        session?.id
      );

      // Update user message status
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, status: 'sent' as const }
          : msg
      ));

      // Create assistant message in legacy format
      const aiMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        text: response.content,
        sender: 'ai',
        timestamp: new Date(),
        status: 'sent',
        actions: response.suggestedActions?.map(action => ({
          type: action.type as 'create_task' | 'update_task' | 'delete_task',
          data: action.data
        })),
        securityWarnings: response.warnings
      };

      setMessages(prev => [...prev, aiMessage]);

      // Handle task creation for legacy compatibility
      if (response.suggestedActions) {
        response.suggestedActions.forEach(action => {
          if (action.type === 'task_created' && onTaskCreated) {
            onTaskCreated(action.data);
          }
        });
        onTasksUpdate?.();
      }

        } catch (error: any) {
          console.error('❌ Enhanced Chat error:', error);
          
          // Update user message with error status
          setMessages(prev => prev.map(msg => 
            msg.id === userMessage.id 
              ? { ...msg, status: 'error' as const }
              : msg
          ));
          
          // Create error message in legacy format
          const errorMessage: Message = {
            id: `msg_${Date.now()}_error`,
            text: 'מצטער, אירעה שגיאה בעת עיבוד הבקשה. אנא נסה שוב.',
            sender: 'ai',
            timestamp: new Date(),
            status: 'sent'
          };

          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
          setLoadingState({ status: 'idle' });
        }
      },
      { messageLength: inputText.length }
    );
  };

  /**
   * Handle key press in input with enhanced features
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Handle input change with validation and length limits
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_INPUT_LENGTH) {
      setInputText(value);
    }
  }, []);

  /**
   * Retry failed message
   */
  const retryMessage = useCallback((messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message && message.sender === 'user') {
      setInputText(message.text);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    }
  }, [messages]);

  /**
   * Copy message to clipboard
   */
  const copyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could show brief success indicator here
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  }, []);

  /**
   * Render loading indicator with progressive messages
   */
  const renderLoadingIndicator = () => {
    if (loadingState.status === 'idle') return null;

    const getLoadingMessage = () => {
      switch (loadingState.status) {
        case 'scanning': return '🔍 בודק אבטחה...';
        case 'checking_cost': return '💰 בודק עלויות...';
        case 'preparing_context': return '📋 מכין הקשר...';
        case 'sanitizing': return '🧹 מנקה קלט...';
        case 'analyzing_intent': return '🧠 מנתח כוונות...';
        case 'calling_claude': return '🤖 שולח ל-Claude...';
        case 'processing_response': return '⚙️ מעבד תשובה...';
        default: return '⏳ עובד...';
      }
    };

    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
            <AIIcon />
          </Avatar>
          <Paper sx={{ p: 2, bgcolor: 'grey.100', minWidth: 150 }}>
            <Typography variant="body2" color="text.secondary">
              {getLoadingMessage()}
            </Typography>
            <LinearProgress 
              sx={{ 
                mt: 1,
                height: 2, 
                borderRadius: 1
              }} 
            />
          </Paper>
        </Box>
      </Box>
    );
  };

  if (isMinimized) {
    return (
      <Fab
        color="primary"
        onClick={onToggleMinimize}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
      >
        <AIIcon />
      </Fab>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 400,
        height: 500,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden'
      }}
    >
      {/* Cost alert */}
      {costAlert.show && (
        <Alert 
          severity="warning" 
          onClose={() => setCostAlert(prev => ({ ...prev, show: false }))}
          sx={{ m: 1 }}
        >
          💰 עלות יומית: ${costAlert.cost.toFixed(2)} (מגבלה: ${costAlert.limit})
        </Alert>
      )}

      {/* Network status */}
      {!isOnline && (
        <Alert severity="info" sx={{ m: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WifiOff fontSize="small" />
            📵 אין חיבור לרשת - עובד במצב offline
          </Box>
        </Alert>
      )}

      {/* Error display */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ m: 1 }}
        >
          {error}
        </Alert>
      )}
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon />
          <Typography variant="h6">AI Assistant</Typography>
        </Box>
        {onToggleMinimize && (
          <IconButton
            size="small"
            onClick={onToggleMinimize}
            sx={{ color: 'white' }}
          >
            <CollapseIcon />
          </IconButton>
        )}
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {messages.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
            <AIIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="body2">
              שלום! איך אוכל לעזור לך היום?
            </Typography>
          </Box>
        )}

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
                display: 'flex',
                flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 1,
                maxWidth: '80%'
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main'
                }}
              >
                {message.sender === 'user' ? <PersonIcon /> : <AIIcon />}
              </Avatar>
              
              <Paper
                sx={{
                  p: 2,
                  bgcolor: message.sender === 'user' ? 'primary.light' : 'grey.100',
                  color: message.sender === 'user' ? 'white' : 'text.primary',
                  position: 'relative',
                  borderRadius: 2
                }}
              >
                {/* Security warnings */}
                {message.securityWarnings && message.securityWarnings.length > 0 && (
                  <Alert 
                    severity="warning" 
                    sx={{ mb: 1 }}
                    icon={<WarningAmber fontSize="small" />}
                  >
                    זוהה מידע רגיש בהודעה
                  </Alert>
                )}

                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    direction: 'auto',
                    unicodeBidi: 'plaintext'
                  }}
                >
                  {message.text}
                </Typography>
                
                {/* Show reasoning for AI messages */}
                {message.sender === 'ai' && message.reasoning && message.reasoning.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      תהליך חשיבה:
                    </Typography>
                    {message.reasoning.map((step, index) => (
                      <Typography key={index} variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                        {step.step}: {step.reasoning} ({step.confidence}%)
                      </Typography>
                    ))}
                  </Box>
                )}
                
                {/* Show tool results */}
                {message.toolResults && message.toolResults.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {message.toolResults.map((result, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Chip
                          label={`🛠️ ${result.type}: ${result.success ? '✅' : '❌'}`}
                          size="small"
                          variant="outlined"
                          color={result.success ? 'success' : 'error'}
                          sx={{ fontSize: '0.75rem', mr: 0.5 }}
                        />
                        {result.data && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                            {result.data.title || JSON.stringify(result.data)}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
                
                {/* Task actions */}
                {message.actions && message.actions.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {message.actions.map((action, index) => (
                      <Chip
                        key={index}
                        label={action.type === 'create_task' ? '✅ משימה נוצרה' : `${action.type}: ${action.data?.title || 'משימה'}`}
                        size="small"
                        variant="outlined"
                        icon={<TaskAlt />}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                )}

                {/* Message metadata and actions */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mt: 1,
                  opacity: 0.7
                }}>
                  <Typography variant="caption">
                    {message.timestamp.toLocaleTimeString('he-IL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    {message.status === 'sending' && ' • שולח...'}
                    {message.status === 'error' && ' • שגיאה'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="העתק">
                      <IconButton 
                        size="small" 
                        onClick={() => copyMessage(message.text)}
                        sx={{ opacity: 0.6 }}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {message.status === 'error' && (
                      <Tooltip title="נסה שוב">
                        <IconButton 
                          size="small" 
                          onClick={() => retryMessage(message.id)}
                          sx={{ opacity: 0.6 }}
                        >
                          <Refresh fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        ))}

        {/* Enhanced loading indicator */}
        {renderLoadingIndicator()}

        <div ref={messagesEndRef} />
      </Box>

      {/* Enhanced Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={3}
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isOnline ? "הקלד הודעה..." : "אין חיבור לרשת"}
            disabled={!isOnline || loadingState.status !== 'idle'}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3
              }
            }}
            helperText={`${inputText.length}/${MAX_INPUT_LENGTH}`}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || !isOnline || loadingState.status !== 'idle'}
            size="large"
            sx={{ 
              minWidth: 44,
              minHeight: 44,
              borderRadius: 3
            }}
          >
            {loadingState.status !== 'idle' ? <Stop /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChatInterface;