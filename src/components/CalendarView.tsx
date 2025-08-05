import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  IconButton,
  Chip,
  Avatar,
  Card,
  CardContent,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  TrendingUp as ProgressIcon,
  Psychology as AIIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { Task, User } from '../types';
import { StorageService } from '../services/StorageService';
import { AIService } from '../services/AIService';

interface CalendarViewProps {
  user: User;
}

const CalendarView: React.FC<CalendarViewProps> = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayTasksOpen, setDayTasksOpen] = useState(false);
  const [aiInsightsOpen, setAiInsightsOpen] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    loadTasks();
    setupServiceWorker();
  }, []);

  const loadTasks = async () => {
    try {
      const tasksData = await StorageService.getAllTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const setupServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered');
        
        // בקש הרשאות להתראות
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // ימים ריקים בתחילת החודש
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // ימים בחודש
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getTasksForDate = (date: Date) => {
    if (!date) return [];
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date && date.toDateString() === today.toDateString();
  };

  const getTaskCountForDate = (date: Date) => {
    return getTasksForDate(date).length;
  };

  const getCompletionRateForDate = (date: Date) => {
    const dateTasks = getTasksForDate(date);
    if (dateTasks.length === 0) return 0;
    return (dateTasks.filter(t => t.completed).length / dateTasks.length) * 100;
  };

  const generateAIInsights = async () => {
    setAiInsightsOpen(true);
    
    const completedThisWeek = tasks.filter(t => {
      if (!t.completed || !t.updatedAt) return false;
      const taskDate = new Date(t.updatedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return taskDate >= weekAgo;
    }).length;

    const pendingTasks = tasks.filter(t => !t.completed).length;
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate || t.completed) return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    const context = `השבוע השלמתי ${completedThisWeek} משימות. יש לי ${pendingTasks} משימות ממתינות ו-${overdueTasks} משימות שפג תוקפן. תן לי תובנות והמלצות לשיפור.`;
    
    const suggestions = await AIService.generateTaskSuggestions(context);
    setInsights([
      `🎯 השבוע השלמת ${completedThisWeek} משימות - ${completedThisWeek > 5 ? 'מעולה!' : 'אפשר להשתפר'}`,
      `⏰ יש לך ${overdueTasks} משימות שפג תוקפן - כדאי להתמקד בהן`,
      `📈 קצב ההשלמה שלך טוב ביותר ב${getMostProductiveDay()}`,
      ...suggestions.slice(0, 3)
    ]);
  };

  const getMostProductiveDay = () => {
    const dayStats: { [key: string]: number } = {};
    
    tasks.filter(t => t.completed && t.updatedAt).forEach(task => {
      const day = new Date(task.updatedAt!).toLocaleDateString('he-IL', { weekday: 'long' });
      dayStats[day] = (dayStats[day] || 0) + 1;
    });

    return Object.entries(dayStats).sort(([,a], [,b]) => b - a)[0]?.[0] || 'ראשון';
  };

  const scheduleNotification = (task: Task) => {
    if (!task.dueDate || Notification.permission !== 'granted') return;
    
    const notificationTime = new Date(task.dueDate);
    notificationTime.setHours(notificationTime.getHours() - 1); // שעה לפני
    
    const timeUntilNotification = notificationTime.getTime() - Date.now();
    
    if (timeUntilNotification > 0) {
      setTimeout(() => {
        new Notification(`תזכורת: ${task.title}`, {
          body: task.description || 'המשימה מתקרבת!',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: task.id,
          requireInteraction: true
        });
      }, timeUntilNotification);
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  return (
    <Container sx={{ py: 2, pb: 10 }}>
      {/* כותרת */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          📅 לוח השנה שלי
        </Typography>
        <Button
          variant="outlined"
          startIcon={<TodayIcon />}
          onClick={() => setCurrentDate(new Date())}
        >
          היום
        </Button>
      </Box>

      {/* ניווט חודש */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigateMonth('prev')}>
            <ChevronRight />
          </IconButton>
          
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {monthName}
          </Typography>
          
          <IconButton onClick={() => navigateMonth('next')}>
            <ChevronLeft />
          </IconButton>
        </Box>

        {/* ימי השבוע */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(day => (
            <Grid item xs key={day}>
              <Typography variant="subtitle2" align="center" color="text.secondary">
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* ימי החודש */}
        <Grid container spacing={1}>
          {days.map((date, index) => {
            if (!date) {
              return <Grid item xs key={index}><Box sx={{ height: 60 }} /></Grid>;
            }

            const dayTasks = getTasksForDate(date);
            const completionRate = getCompletionRateForDate(date);
            const taskCount = dayTasks.length;

            return (
              <Grid item xs key={index}>
                <Paper
                  sx={{
                    height: 60,
                    p: 1,
                    cursor: 'pointer',
                    bgcolor: isToday(date) ? 'primary.light' : 'background.paper',
                    color: isToday(date) ? 'white' : 'text.primary',
                    border: taskCount > 0 ? `2px solid ${completionRate === 100 ? '#4caf50' : '#ff9800'}` : 'none',
                    '&:hover': { bgcolor: isToday(date) ? 'primary.main' : 'grey.100' }
                  }}
                  onClick={() => {
                    setSelectedDate(date);
                    setDayTasksOpen(true);
                  }}
                >
                  <Typography variant="body2" align="center" sx={{ fontWeight: 600 }}>
                    {date.getDate()}
                  </Typography>
                  
                  {taskCount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                      <Chip
                        label={taskCount}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.7rem',
                          bgcolor: completionRate === 100 ? '#4caf50' : '#ff9800',
                          color: 'white'
                        }}
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* סטטיסטיקות מהירות */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {tasks.filter(t => t.completed && t.updatedAt && 
                  new Date(t.updatedAt).toDateString() === new Date().toDateString()).length}
              </Typography>
              <Typography variant="body2">הושלמו היום</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {tasks.filter(t => !t.completed && t.dueDate && 
                  new Date(t.dueDate).toDateString() === new Date().toDateString()).length}
              </Typography>
              <Typography variant="body2">ליום היום</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* כפתורי פעולה */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={generateAIInsights}
      >
        <AIIcon />
      </Fab>

      <Fab
        color="secondary"
        sx={{ position: 'fixed', bottom: 150, right: 16 }}
        onClick={() => {
          // הוספת תזכורת חכמה
          if (Notification.permission === 'granted') {
            new Notification('🔔 זמן לבדוק את המשימות!', {
              body: 'איך הולך לך היום? יש לך משימות שממתינות',
              icon: '/icon-192x192.png'
            });
          }
        }}
      >
        <NotificationIcon />
      </Fab>

      {/* דיאלוג משימות יום */}
      <Dialog open={dayTasksOpen} onClose={() => setDayTasksOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          משימות ל-{selectedDate?.toLocaleDateString('he-IL')}
        </DialogTitle>
        <DialogContent>
          {selectedDate && getTasksForDate(selectedDate).length === 0 ? (
            <Typography color="text.secondary">אין משימות ליום זה</Typography>
          ) : (
            <List>
              {selectedDate && getTasksForDate(selectedDate).map(task => (
                <React.Fragment key={task.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: task.completed ? 'success.main' : 'warning.main' }}>
                        {task.completed ? '✅' : '⏳'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <Box>
                          <Typography variant="body2">{task.description}</Typography>
                          {task.estimatedTime && (
                            <Chip 
                              icon={<TimeIcon />}
                              label={`${task.estimatedTime} דק'`}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* דיאלוג תובנות AI */}
      <Dialog open={aiInsightsOpen} onClose={() => setAiInsightsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ProgressIcon color="primary" />
            תובנות חכמות על הביצועים שלך
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {insights.map((insight, index) => (
              <ListItem key={index}>
                <ListItemText 
                  primary={insight}
                  sx={{ '& .MuiListItemText-primary': { fontSize: '1rem', lineHeight: 1.6 } }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default CalendarView;