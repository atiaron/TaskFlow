import React, { useState, useEffect } from 'react';
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
  FormControlLabel
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
  Psychology as AIIcon
} from '@mui/icons-material';
import { Task, User } from '../types';
import { StorageService } from '../services/StorageService';
import { AIService } from '../services/AIService';

interface TaskListProps {
  user: User;
}

const TaskList: React.FC<TaskListProps> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'today'>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const tasksData = await StorageService.getAllTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const toggleTaskComplete = async (task: Task) => {
    try {
      const updatedTask = {
        ...task,
        completed: !task.completed,
        updatedAt: new Date()
      };
      
      await StorageService.updateTask(task.id!, updatedTask);
      setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
      
      // הצגת הודעת הצלחה חכמה
      if (updatedTask.completed) {
        console.log(`🎉 כל הכבוד! השלמת את "${task.title}"`);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await StorageService.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      setAnchorEl(null);
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

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'pending': return !task.completed;
      case 'completed': return task.completed;
      case 'today': 
        const today = new Date().toDateString();
        return task.dueDate && new Date(task.dueDate).toDateString() === today;
      default: return true;
    }
  });

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
    
    const suggestions = await AIService.generateTaskSuggestions(context);
    setSuggestions(suggestions);
  };

  return (
    <Container sx={{ py: 2, pb: 10 }}>
      {/* כותרת ונתונים */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          המשימות שלי
        </Typography>
        
        {/* סטטיסטיקות */}
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">היום השלמתי</Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.todayCompleted}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2">סה"כ: {stats.total}</Typography>
              <Typography variant="body2">ממתינות: {stats.pending}</Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}
                sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.3)' }}
              />
            </Box>
          </Box>
        </Paper>

        {/* פילטרים */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {[
            { key: 'all', label: 'הכל', count: stats.total },
            { key: 'pending', label: 'ממתינות', count: stats.pending },
            { key: 'completed', label: 'הושלמו', count: stats.completed },
            { key: 'today', label: 'היום', count: tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString()).length }
          ].map(({ key, label, count }) => (
            <Chip
              key={key}
              label={`${label} (${count})`}
              onClick={() => setFilter(key as any)}
              variant={filter === key ? 'filled' : 'outlined'}
              color={filter === key ? 'primary' : 'default'}
            />
          ))}
        </Box>
      </Box>

      {/* רשימת משימות */}
      <Box sx={{ space: 2 }}>
        {filteredTasks.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
            <Typography variant="h6" color="text.secondary">
              {filter === 'all' ? 'אין לך משימות עדיין' : 'אין משימות בקטגוריה זו'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {filter === 'all' ? 'בוא נתחיל ליצור כמה משימות!' : 'נסה לבחור קטגוריה אחרת'}
            </Typography>
          </Paper>
        ) : (
          filteredTasks.map((task) => (
            <Paper 
              key={task.id} 
              sx={{ 
                p: 2, 
                mb: 2, 
                borderLeft: `4px solid ${getPriorityColor(task.priority || 'medium')}`,
                opacity: task.completed ? 0.7 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {/* checkbox */}
                <IconButton 
                  onClick={() => toggleTaskComplete(task)}
                  sx={{ mt: -1 }}
                >
                  {task.completed ? 
                    <CompleteIcon color="success" /> : 
                    <IncompleteIcon color="action" />
                  }
                </IconButton>

                {/* תוכן המשימה */}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      textDecoration: task.completed ? 'line-through' : 'none',
                      mb: 1
                    }}
                  >
                    {task.title}
                  </Typography>
                  
                  {task.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {task.description}
                    </Typography>
                  )}

                  {/* תגיות ומטא-דאטה */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                    {/* עדיפות */}
                    <Chip 
                      icon={<PriorityIcon />}
                      label={task.priority || 'medium'}
                      size="small"
                      sx={{ 
                        bgcolor: getPriorityColor(task.priority || 'medium'),
                        color: 'white'
                      }}
                    />

                    {/* זמן משוער */}
                    {task.estimatedTime && (
                      <Chip 
                        icon={<TimeIcon />}
                        label={getEstimatedTimeText(task.estimatedTime)}
                        size="small"
                        variant="outlined"
                      />
                    )}

                    {/* תגיות */}
                    {task.tags?.map(tag => (
                      <Chip 
                        key={tag}
                        icon={<TagIcon />}
                        label={tag}
                        size="small"
                        variant="outlined"
                        color="secondary"
                      />
                    ))}

                    {/* תאריך יעד */}
                    {task.dueDate && (
                      <Typography variant="caption" color="text.secondary">
                        יעד: {new Date(task.dueDate).toLocaleDateString('he-IL')}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* תפריט פעולות */}
                <IconButton 
                  onClick={(e) => {
                    setAnchorEl(e.currentTarget);
                    setSelectedTask(task);
                  }}
                >
                  <MoreIcon />
                </IconButton>
              </Box>
            </Paper>
          ))
        )}
      </Box>

      {/* כפתור הוספה */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={generateAISuggestions}
      >
        <AIIcon />
      </Fab>

      <Fab
        color="secondary"
        sx={{ position: 'fixed', bottom: 150, right: 16 }}
        onClick={() => {/* לחזור לצ'אט */}}
      >
        <AddIcon />
      </Fab>

      {/* תפריט פעולות */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
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
                      title: suggestion,
                      description: 'משימה שהוצעה על ידי AI',
                      priority: 'medium' as const,
                      completed: false,
                      tags: [],
                      createdAt: new Date(),
                      updatedAt: new Date()
                    };
                    
                    await StorageService.addTask(newTask);
                    loadTasks();
                    setAiSuggestionsOpen(false);
                  }}
                >
                  <Typography variant="body1">{suggestion}</Typography>
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