/* cspell:disable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  IconButton,
  Avatar,
  LinearProgress,
  Fab,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Slide,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Tooltip,
  InputAdornment,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CheckCircle as CompleteIcon,
  RadioButtonUnchecked as IncompleteIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AccessTime as TimeIcon,
  Flag as PriorityIcon,
  LocalOffer as TagIcon,
  MoreVert as MoreIcon,
  TrendingUp as ProgressIcon,
  Psychology as AIIcon,
  PlayArrow as FocusIcon,
  Share as ShareIcon,
  Star as StarIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Sync as SyncIcon,
  Warning as WarningIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Schedule as ScheduleIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import type { Task, TaskPriority, TaskCategory, SecurityScanResult, User } from '../types/index';
import { FirebaseService } from '../services/FirebaseService';
import { EnhancedClaudeService } from '../services/EnhancedClaudeService';
import { SecurityManager } from '../services/SecurityManager';
import { RealTimeSyncService } from '../services/RealTimeSyncService';
import GamificationSystem from './GamificationSystem';
import SmartNotificationSystem, { useSmartNotifications } from './SmartNotificationSystem';
import QuickActionsMenu from './QuickActionsMenu';
import FocusMode from './FocusMode';
import EmptyState from './EmptyState';
import DailyTip from './DailyTip';
import AnimatedList from './AnimatedList';

// Enhanced interfaces for new architecture
interface TaskListProps {
  user: User;
  onTasksUpdate?: () => void;
  onTaskCreated?: (task: Task) => void;
  className?: string;
  maxItems?: number;
  enableAICreation?: boolean;
  enableSearch?: boolean;
  variant?: 'full' | 'compact' | 'widget';
}

interface LoadingState {
  status: 'idle' | 'loading' | 'phase1' | 'phase2' | 'phase3' | 'complete' | 'error';
  message?: string;
  progress?: number;
}

interface TaskCreationSuggestion {
  confidence: number;
  action: 'create_automatic' | 'ask_confirmation' | 'none';
  suggestedTask?: Partial<Task>;
  reasoning: string;
  userMessage: string;
}

interface ConflictResolution {
  taskId: string;
  localTask: Task;
  remoteTask: Task;
  conflictType: 'smart_merge' | 'user_decision' | 'last_write_wins';
  resolvedTask?: Task;
}

const TaskList: React.FC<TaskListProps> = ({ 
  user, 
  onTasksUpdate,
  onTaskCreated,
  className,
  maxItems = 50,
  enableAICreation = true,
  enableSearch = true,
  variant = 'full'
}) => {
  // Core state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({ status: 'idle' });
  
  // Enhanced filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'today' | 'overdue'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'priority' | 'title'>('created_at');
  
  // Dialog and interaction state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  
  // AI and smart features
  const [aiSuggestion, setAiSuggestion] = useState<TaskCreationSuggestion | null>(null);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<TaskCreationSuggestion[]>([]);
  const [pendingConflicts, setPendingConflicts] = useState<ConflictResolution[]>([]);
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing' | 'error'>('online');
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  
  // Form state for task creation/editing
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('personal');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');
  
  // Services
  const claudeService = useRef(EnhancedClaudeService.getInstance());
  const securityManager = useRef(SecurityManager.getInstance());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // השתמש במערכת ההודעות החכמה
  const {
    notifications,
    removeNotification,
    showSuccess,
    showAchievement,
    showCelebration,
    showStreak,
    showAIInsight,
    showTip
  } = useSmartNotifications();

  // Progressive loading of tasks
  const loadTasks = useCallback(async () => {
    try {
      setLoadingState({ status: 'loading', message: 'טוען משימות...', progress: 0 });
      
      // Phase 1: Load essential tasks (instant)
      setLoadingState({ status: 'phase1', message: 'טוען משימות עיקריות...', progress: 25 });
      const essentialTasks = await FirebaseService.getTasks(user.id);
      setTasks(essentialTasks);
      setLoadingState({ status: 'phase1', message: 'טעינה מהירה הושלמה', progress: 50 });
      
      // Complete loading
      setTimeout(() => {
        setLoadingState({ status: 'complete', progress: 100 });
        setTimeout(() => setLoadingState({ status: 'idle' }), 1000);
      }, 500);
      
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setLoadingState({ status: 'error', message: 'שגיאה בטעינת משימות' });
      
      // Fallback to cached tasks
      const cachedTasks = localStorage.getItem(`tasks_${user.id}`);
      if (cachedTasks) {
        setTasks(JSON.parse(cachedTasks));
        showAIInsight('טוען משימות מהמטמון המקומי', 'info');
      }
    }
  }, [user.id, showAIInsight]);

  // Smart filtering and search
  useEffect(() => {
    let filtered = tasks;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // Filter by completion status
    switch (filter) {
      case 'pending':
        filtered = filtered.filter(task => !task.completed);
        break;
      case 'completed':
        filtered = filtered.filter(task => task.completed);
        break;
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filtered = filtered.filter(task => 
          task.dueDate &&
          new Date(task.dueDate) >= today &&
          new Date(task.dueDate) < tomorrow
        );
        break;
      case 'overdue':
        const now = new Date();
        filtered = filtered.filter(task => 
          task.dueDate &&
          new Date(task.dueDate) < now &&
          !task.completed
        );
        break;
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(task => (task as any).category === categoryFilter);
    }

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title, 'he');
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority || 'medium'] || 0) - (priorityOrder[a.priority || 'medium'] || 0);
        case 'due_date':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'created_at':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    // Limit results for performance
    if (maxItems && filtered.length > maxItems) {
      filtered = filtered.slice(0, maxItems);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, filter, priorityFilter, categoryFilter, sortBy, maxItems]);

  // Load tasks on mount and user change
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Real-time tasks sync
  useEffect(() => {
    const syncService = RealTimeSyncService.getInstance();
    
    const unsubscribe = syncService.subscribeToTasks((updatedTasks) => {
      setTasks(updatedTasks);
      onTasksUpdate?.();
    });

    return unsubscribe;
  }, [onTasksUpdate]);

  // AI-powered task creation detection
  const detectTaskCreationIntent = useCallback(async (userInput: string): Promise<TaskCreationSuggestion> => {
    try {
      if (!enableAICreation) {
        return { confidence: 0, action: 'none', reasoning: 'AI creation disabled', userMessage: userInput };
      }

      // Use SecurityManager to scan for sensitive information
      const securityScan = await securityManager.current.scanMessage(userInput);
      if (securityScan.has_sensitive_data) {
        return { 
          confidence: 0, 
          action: 'none', 
          reasoning: 'Sensitive data detected, not creating task',
          userMessage: userInput
        };
      }

      // Simple rule-based detection (future: integrate with Claude API)
      const createKeywords = ['צור משימה', 'תוסיף משימה', 'רשום לי', 'תזכור לי'];
      const remindKeywords = ['תזכיר לי', 'צריך לעשות', 'אל תשכח'];
      
      const input = userInput.toLowerCase();
      
      // High confidence patterns
      if (createKeywords.some(keyword => input.includes(keyword))) {
        const taskTitle = userInput.replace(/צור משימה|תוסיף משימה|רשום לי/g, '').trim();
        return {
          confidence: 95,
          action: 'create_automatic',
          suggestedTask: {
            title: taskTitle || 'משימה חדשה',
            description: userInput,
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date(),
            completed: false
          },
          reasoning: 'זוהתה בקשה ברורה ליצירת משימה',
          userMessage: userInput
        };
      }

      // Medium confidence patterns
      if (remindKeywords.some(keyword => input.includes(keyword))) {
        const taskTitle = userInput.replace(/תזכיר לי|צריך לעשות|אל תשכח/g, '').trim();
        return {
          confidence: 75,
          action: 'ask_confirmation',
          suggestedTask: {
            title: taskTitle || 'תזכורת',
            description: userInput,
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date(),
            completed: false
          },
          reasoning: 'זוהתה בקשה אפשרית ליצירת תזכורת',
          userMessage: userInput
        };
      }

      return { confidence: 0, action: 'none', reasoning: 'לא זוהתה כוונה ליצירת משימה', userMessage: userInput };
      
    } catch (error) {
      console.error('Error detecting task creation intent:', error);
      return { confidence: 0, action: 'none', reasoning: 'שגיאה בזיהוי כוונות', userMessage: userInput };
    }
  }, [enableAICreation, user.id]);

  // Smart task creation handler
  const handleSmartTaskCreation = useCallback(async (userInput: string) => {
    const suggestion = await detectTaskCreationIntent(userInput);
    
    if (suggestion.action === 'create_automatic' && suggestion.suggestedTask) {
      // Auto-create task
      await handleCreateTask(suggestion.suggestedTask);
      showSuccess('✅ יצרתי משימה', `"${suggestion.suggestedTask.title}"`);
      setAiSuggestion(null);
    } else if (suggestion.action === 'ask_confirmation' && suggestion.suggestedTask) {
      // Ask for confirmation
      setAiSuggestion(suggestion);
    }
  }, [detectTaskCreationIntent]);

  // Handle AI suggestion response
  const handleAISuggestionResponse = useCallback(async (accept: boolean) => {
    if (!aiSuggestion || !aiSuggestion.suggestedTask) return;
    
    if (accept) {
      await handleCreateTask(aiSuggestion.suggestedTask);
      showSuccess('✅ משימה נוצרה', `"${aiSuggestion.suggestedTask.title}"`);
      if (onTaskCreated) {
        onTaskCreated(aiSuggestion.suggestedTask as Task);
      }
    } else {
      showAIInsight('בסדר, לא יוצר משימה', 'תמיד אפשר ליצור משימה ידנית');
    }
    
    setAiSuggestion(null);
  }, [aiSuggestion, onTaskCreated, showSuccess, showAIInsight]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setSyncStatus('online');
    const handleOffline = () => setSyncStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTaskComplete = async (task: Task) => {
    try {
      const updatedTask = {
        ...task,
        completed: !task.completed,
        updatedAt: new Date()
      };
      
      await FirebaseService.updateTask(user.id, task.id!, updatedTask);
      setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
      
      // הצגת הודעות חכמות
      if (updatedTask.completed) {
        showSuccess('כל הכבוד! 🎉', `השלמת את "${task.title}"`);
        
        // בדוק הישגים
        const completedToday = tasks.filter(t => 
          t.completed && 
          t.updatedAt && 
          new Date(t.updatedAt).toDateString() === new Date().toDateString()
        ).length + 1;
        
        if (completedToday === 1) {
          showTip('התחלה מעולה!', 'המשימה הראשונה היום הושלמה!');
        } else if (completedToday === 5) {
          showAchievement('אלוף יומי! 🏆', 'השלמת 5 משימות היום!');
        } else if (completedToday === 10) {
          showCelebration('מדהים! 🚀', 'השלמת 10 משימות ביום אחד!');
        }
        
        // בדוק רצף ימים
        checkStreak();
      }
      
      onTasksUpdate?.();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const checkStreak = () => {
    // חישוב רצף פשוט - ניתן לשפר
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayTasks = tasks.filter(t => 
      t.completed && 
      t.updatedAt && 
      new Date(t.updatedAt).toDateString() === yesterday.toDateString()
    );
    
    if (yesterdayTasks.length > 0) {
      showStreak('רצף נמשך! 🔥', 'המשכת את הרצף שלך!', 2);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await FirebaseService.deleteTask(user.id, taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      setAnchorEl(null);
      onTasksUpdate?.();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getEstimatedTimeText = (minutes: number) => {
    if (minutes < 60) return `${minutes} דק'`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}:${remainingMinutes.toString().padStart(2, '0')} שעות` : `${hours} שעות`;
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    todayCompleted: tasks.filter(t => 
      t.completed && 
      t.updatedAt && 
      new Date(t.updatedAt).toDateString() === new Date().toDateString()
    ).length
  };

  const generateAISuggestions = async () => {
    setAiSuggestionsOpen(true);
    const pendingTasks = tasks.filter(t => !t.completed);
    const context = `יש לי ${pendingTasks.length} משימות ממתינות. אני צריך עזרה בתכנון היום.`;
    
    // const suggestions = await EnhancedClaudeService.generateTaskSuggestions(context);
    const suggestions: TaskCreationSuggestion[] = [];
    // TODO: Implement AI task suggestions
    setSuggestions(suggestions);
    
    showAIInsight(
      'הצעות חכמות מוכנות!',
      `יצרתי ${suggestions.length} הצעות בהתבסס על המשימות שלך`,
      'צפה בהצעות',
      () => setAiSuggestionsOpen(true)
    );
  };

  const handleCreateTask = useCallback(async (taskData: Partial<Task>) => {
    let newTask: Partial<Task> | null = null;
    
    try {
      setSyncStatus('syncing');
      
      newTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: taskData.title || 'משימה חדשה',
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        category: (taskData as any).category || 'personal',
        completed: false,
        tags: taskData.tags || [],
        estimated_duration: (taskData as any).estimated_duration,
        dueDate: taskData.dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        user_id: user.id,
        created_by: 'manual',
        version: 1,
        last_modified_by: 'user'
      } as Task;

      // Optimistic update
      const tempTask = newTask as Task;
      setTasks(prev => [tempTask, ...prev]);
      
      try {
        // Attempt to save to database
        await FirebaseService.addTask(user.id, newTask as Omit<Task, 'id'>);
        setSyncStatus('online');
        
        // Reload tasks to get server-assigned ID
        setTimeout(() => loadTasks(), 500);
        
        showSuccess('נוצרה בהצלחה!', `המשימה "${newTask?.title}" נוספה למערכת`);
        
        if (onTaskCreated) {
          onTaskCreated(tempTask);
        }
        
        if (onTasksUpdate) {
          onTasksUpdate();
        }
        
      } catch (error) {
        // Network error - add to offline queue
        console.error('Failed to sync task to server:', error);
        setOfflineQueue(prev => [...prev, { action: 'create', data: newTask }]);
        setSyncStatus('offline');
        showAIInsight('שמור במטמון', 'המשימה תישמר כשהחיבור יחזור');
      }
      
    } catch (error) {
      console.error('Failed to create task:', error);
      setSyncStatus('error');
      // Remove from optimistic update if newTask was created
      if (newTask?.id) {
        setTasks(prev => prev.filter(t => t.id !== newTask!.id));
      }
    }
  }, [user.id, onTaskCreated, onTasksUpdate, loadTasks, showSuccess, showAIInsight]);

  const handleQuickAdd = async (text: string) => {
    try {
      // יצירת משימה פשוטה מהטקסט
      await handleCreateTask({
        title: text,
        description: 'נוצרה באמצעות הוספה מהירה',
        tags: ['מהיר']
      });
    } catch (error) {
      console.error('Failed to create quick task:', error);
    }
  };

  const handleFocusMode = (task: Task) => {
    setFocusTask(task);
    setFocusModeOpen(true);
    setAnchorEl(null);
  };

  const handleAIAnalysis = () => {
    const pendingTasks = tasks.filter(t => !t.completed).length;
    const completedToday = tasks.filter(t => 
      t.completed && 
      t.updatedAt && 
      new Date(t.updatedAt).toDateString() === new Date().toDateString()
    ).length;
    
    showAIInsight(
      'ניתוח תפוקה',
      `היום השלמת ${completedToday} משימות. נותרו ${pendingTasks} משימות ממתינות.`,
      'קבל טיפים',
      () => {
        if (completedToday === 0) {
          showTip('בוא נתחיל!', 'נסה להשלים משימה קטנה כדי להתחיל את היום');
        } else if (completedToday < 3) {
          showTip('בדרך הנכונה!', 'נסה להשלים עוד 2-3 משימות כדי ליצור מומנטום');
        } else {
          showCelebration('יום פרודוקטיבי!', 'אתה בביצועים מעולים היום!');
        }
      }
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 2, pb: 10, px: { xs: 2, sm: 3 } }}>
      {/* מערכת הודעות חכמה */}
      <SmartNotificationSystem 
        notifications={notifications}
        onDismiss={removeNotification}
      />

      {/* מערכת גיימיפיקציה פשוטה */}
      <GamificationSystem tasks={tasks} />

      {/* טיפ יומי */}
      <DailyTip />

      {/* כותרת נקייה */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            color: 'text.primary',
            mb: 1,
            letterSpacing: '-0.02em'
          }}
        >
          המשימות שלי
        </Typography>
        
        <Typography variant="body1" color="text.secondary">
          {stats.pending > 0 
            ? `${stats.pending} משימות ממתינות` 
            : 'כל המשימות הושלמו! 🎉'
          }
        </Typography>
      </Box>

      {/* פילטרים אלגנטיים */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        mb: 3, 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'all', label: 'הכל', count: stats.total },
          { key: 'pending', label: 'ממתינות', count: stats.pending },
          { key: 'completed', label: 'הושלמו', count: stats.completed }
        ].map(({ key, label, count }) => (
          <Chip
            key={key}
            label={`${label} ${count > 0 ? `(${count})` : ''}`}
            onClick={() => setFilter(key as any)}
            variant={filter === key ? 'filled' : 'outlined'}
            color={filter === key ? 'primary' : 'default'}
            sx={{
              height: 36,
              fontSize: '0.9rem',
              fontWeight: 500,
              '&.MuiChip-filled': {
                bgcolor: 'primary.main',
                color: 'white'
              }
            }}
          />
        ))}
      </Box>

      {/* רשימת משימות נקייה */}
      <Box sx={{ mb: 8 }}>
        {filteredTasks.length === 0 ? (
          <EmptyState
            title={filter === 'all' ? '🎯 בואו נתחיל!' : 'אין משימות בקטגוריה זו'}
            description={filter === 'all' 
              ? 'צור את המשימה הראשונה שלך והתחל להיות פרודוקטיבי'
              : 'נסה לבחור קטגוריה אחרת או צור משימה חדשה'
            }
            actionText={filter === 'all' ? 'צור משימה ראשונה' : undefined}
            onAction={filter === 'all' ? () => handleCreateTask({}) : undefined}
            icon={filter === 'all' ? 
              <AddIcon sx={{ fontSize: 64, color: 'primary.light', opacity: 0.6 }} /> : 
              undefined
            }
          />
        ) : (
          <AnimatedList>
            {filteredTasks.map((task) => (
              <Paper 
                key={task.id} 
                className="task-item"
                sx={{ 
                  p: 0,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                  },
                  opacity: task.completed ? 0.6 : 1,
                  borderLeft: `4px solid ${getPriorityColor(task.priority || 'medium')}`
                }}
              >
                <Box sx={{ p: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  {/* Checkbox אלגנטי */}
                  <IconButton 
                    onClick={() => toggleTaskComplete(task)}
                    sx={{ 
                      mt: -0.5,
                      p: 0.5,
                      '&:hover': {
                        bgcolor: 'transparent',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    {task.completed ? 
                      <CompleteIcon sx={{ color: 'success.main', fontSize: 24 }} /> : 
                      <IncompleteIcon sx={{ color: 'action.disabled', fontSize: 24 }} />
                    }
                  </IconButton>

                  {/* תוכן המשימה */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        textDecoration: task.completed ? 'line-through' : 'none',
                        color: task.completed ? 'text.secondary' : 'text.primary',
                        fontWeight: 500,
                        fontSize: '1rem',
                        lineHeight: 1.4,
                        mb: task.description ? 1 : 0
                      }}
                    >
                      {task.title}
                    </Typography>
                    
                    {task.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 1.5,
                          lineHeight: 1.5,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {task.description}
                      </Typography>
                    )}

                    {/* מטא-דאטה נקייה */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 1, 
                      alignItems: 'center' 
                    }}>
                      {/* זמן משוער */}
                      {task.estimated_duration && (
                        <Chip 
                          icon={<TimeIcon sx={{ fontSize: 16 }} />}
                          label={getEstimatedTimeText(task.estimated_duration)}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            height: 24,
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            borderColor: 'divider'
                          }}
                        />
                      )}

                      {/* תגיות */}
                      {task.tags?.slice(0, 2).map(tag => (
                        <Chip 
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{ 
                            height: 24,
                            fontSize: '0.75rem',
                            bgcolor: 'primary.light',
                            color: 'primary.dark',
                            fontWeight: 500
                          }}
                        />
                      ))}

                      {/* תאריך יעד */}
                      {task.dueDate && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}
                        >
                          📅 {new Date(task.dueDate).toLocaleDateString('he-IL')}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* תפריט פעולות מינימליסטי */}
                  <IconButton 
                    onClick={(e) => {
                      setAnchorEl(e.currentTarget);
                      setSelectedTask(task);
                    }}
                    sx={{ 
                      mt: -0.5,
                      color: 'action.disabled',
                      '&:hover': { 
                        color: 'text.primary',
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <MoreIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </AnimatedList>
        )}
      </Box>

      {/* תפריט פעולות מהיר */}
      <QuickActionsMenu
        onCreateTask={handleCreateTask}
        onAIAnalysis={handleAIAnalysis}
        onQuickAdd={handleQuickAdd}
        user={user}
        recentTasks={tasks.slice(-5)}
      />

      {/* כפתורי פעולה צפים */}
      <Fab
        color="primary"
        sx={{ 
          position: 'fixed', 
          bottom: 80, 
          right: 16,
          boxShadow: '0 4px 20px rgba(74, 144, 226, 0.3)'
        }}
        onClick={generateAISuggestions}
      >
        <AIIcon />
      </Fab>

      <Fab
        color="secondary"
        sx={{ 
          position: 'fixed', 
          bottom: 150, 
          right: 16,
          boxShadow: '0 4px 20px rgba(126, 211, 33, 0.3)'
        }}
        onClick={() => handleCreateTask({})}
      >
        <AddIcon />
      </Fab>

      {/* תפריט פעולות */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleFocusMode(selectedTask!)}>
          <FocusIcon sx={{ mr: 1 }} />
          מצב פוקוס
        </MenuItem>
        <MenuItem onClick={() => {
          setEditDialogOpen(true);
          setAnchorEl(null);
        }}>
          <EditIcon sx={{ mr: 1 }} />
          עריכה
        </MenuItem>
        <MenuItem onClick={() => selectedTask && deleteTask(selectedTask.id!)}>
          <DeleteIcon sx={{ mr: 1 }} />
          מחיקה
        </MenuItem>
      </Menu>

      {/* מצב פוקוס */}
      <FocusMode
        open={focusModeOpen}
        onClose={() => setFocusModeOpen(false)}
        currentTask={focusTask || undefined}
        onTaskComplete={(taskId) => {
          const task = tasks.find(t => t.id === taskId);
          if (task) toggleTaskComplete(task);
          setFocusModeOpen(false);
        }}
        onTaskSkip={() => setFocusModeOpen(false)}
      />

      {/* דיאלוג הצעות AI */}
      <Dialog open={aiSuggestionsOpen} onClose={() => setAiSuggestionsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            הצעות חכמות למשימות
          </Box>
        </DialogTitle>
        <DialogContent>
          {suggestions.length === 0 ? (
            <Typography>טוען הצעות...</Typography>
          ) : (
            <Box sx={{ space: 1 }}>
              {suggestions.map((suggestion, index) => (
                <Paper 
                  key={index}
                  sx={{ p: 2, mb: 1, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}
                  onClick={async () => {
                    // יצירת משימה מההצעה
                    const newTask = {
                      title: suggestion.suggestedTask?.title || 'משימה מוצעת',
                      description: suggestion.reasoning || 'משימה שהוצעה על ידי AI',
                      priority: suggestion.suggestedTask?.priority || 'medium' as const,
                      completed: false,
                      tags: [],
                      createdAt: new Date(),
                      updatedAt: new Date()
                    };
                    
                    await FirebaseService.addTask(user.id, newTask as any);
                    loadTasks();
                    setAiSuggestionsOpen(false);
                  }}
                >
                  <Typography variant="body1">{suggestion.suggestedTask?.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{suggestion.reasoning}</Typography>
                  <Typography variant="caption">רמת ביטחון: {suggestion.confidence}%</Typography>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiSuggestionsOpen(false)}>סגור</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TaskList;