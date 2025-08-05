import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns';
import { Task, CalendarEvent } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services/FirebaseService';

const CalendarView: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = firebaseService.subscribeToUserTasks(user.uid, (fetchedTasks) => {
      setTasks(fetchedTasks);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => 
      task.dueDate && isSameDay(task.dueDate, date)
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const dayTasks = getTasksForDate(day);
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isCurrentDay = isToday(day);
      
      days.push(
        <Grid item xs={12/7} key={day.toString()}>
          <Paper
            sx={{
              minHeight: isMobile ? 80 : 120,
              p: 0.5,
              border: '1px solid',
              borderColor: isCurrentDay ? 'primary.main' : 'divider',
              bgcolor: isCurrentMonth ? 'background.paper' : 'action.hover',
              opacity: isCurrentMonth ? 1 : 0.6,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover'
              }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 0.5
              }}
            >
              <Typography
                variant={isMobile ? 'body2' : 'body1'}
                fontWeight={isCurrentDay ? 'bold' : 'normal'}
                color={isCurrentDay ? 'primary.main' : 'text.primary'}
              >
                {format(day, 'd')}
              </Typography>
              {dayTasks.length > 0 && (
                <Chip
                  label={dayTasks.length}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.7rem',
                    bgcolor: 'primary.main',
                    color: 'white'
                  }}
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {dayTasks.slice(0, isMobile ? 2 : 3).map((task) => (
                <Tooltip key={task.id} title={task.title}>
                  <Box
                    sx={{
                      fontSize: '0.6rem',
                      p: 0.25,
                      borderRadius: 0.5,
                      bgcolor: getPriorityColor(task.priority),
                      color: 'white',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      opacity: task.completed ? 0.6 : 1,
                      textDecoration: task.completed ? 'line-through' : 'none'
                    }}
                  >
                    {task.title}
                  </Box>
                </Tooltip>
              ))}
              {dayTasks.length > (isMobile ? 2 : 3) && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.6rem',
                    color: 'text.secondary',
                    textAlign: 'center'
                  }}
                >
                  +{dayTasks.length - (isMobile ? 2 : 3)} more
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      );
      
      day = addDays(day, 1);
    }

    return days;
  };

  const renderWeekDays = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return weekDays.map((day) => (
      <Grid item xs={12/7} key={day}>
        <Typography
          variant="body2"
          align="center"
          fontWeight="bold"
          color="text.secondary"
          sx={{ p: 1 }}
        >
          {day}
        </Typography>
      </Grid>
    ));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading calendar...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          p: 2
        }}
      >
        <Typography variant="h5" component="h1" fontWeight="bold">
          {format(currentDate, 'MMMM yyyy')}
        </Typography>
        
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={handlePrevMonth} size="small">
            <ChevronLeftIcon />
          </IconButton>
          
          <IconButton onClick={handleToday} size="small">
            <TodayIcon />
          </IconButton>
          
          <IconButton onClick={handleNextMonth} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Calendar Grid */}
      <Box sx={{ px: 1 }}>
        <Grid container spacing={0.5}>
          {/* Week day headers */}
          {renderWeekDays()}
          
          {/* Calendar days */}
          {renderCalendarDays()}
        </Grid>
      </Box>

      {/* Legend */}
      <Box sx={{ mt: 3, p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Priority Legend:
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: 0.5,
                bgcolor: theme.palette.error.main
              }}
            />
            <Typography variant="caption">High</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: 0.5,
                bgcolor: theme.palette.warning.main
              }}
            />
            <Typography variant="caption">Medium</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: 0.5,
                bgcolor: theme.palette.success.main
              }}
            />
            <Typography variant="caption">Low</Typography>
          </Box>
        </Box>
      </Box>

      {/* Summary */}
      <Box sx={{ mt: 2, p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          This Month Summary:
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Chip
            label={`${tasks.filter(t => t.dueDate && isSameMonth(t.dueDate, currentDate)).length} total tasks`}
            variant="outlined"
          />
          <Chip
            label={`${tasks.filter(t => t.dueDate && isSameMonth(t.dueDate, currentDate) && t.completed).length} completed`}
            color="success"
            variant="outlined"
          />
          <Chip
            label={`${tasks.filter(t => t.dueDate && isSameMonth(t.dueDate, currentDate) && !t.completed).length} pending`}
            color="warning"
            variant="outlined"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default CalendarView;