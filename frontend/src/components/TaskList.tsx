import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Chip,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { Task } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services/FirebaseService';
import TaskForm from './TaskForm';

const TaskList: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created'>('created');

  useEffect(() => {
    if (!user) return;

    const unsubscribe = firebaseService.subscribeToUserTasks(user.uid, (fetchedTasks) => {
      setTasks(fetchedTasks);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      await firebaseService.toggleTaskComplete(taskId, completed);
    } catch (error) {
      setError('Failed to update task');
      console.error('Error updating task:', error);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    if (!user) return;
    
    setFormLoading(true);
    try {
      await firebaseService.createTask({
        ...taskData,
        userId: user.uid,
        completed: false
      });
      setShowTaskForm(false);
      setSelectedTask(null);
    } catch (error) {
      setError('Failed to create task');
      console.error('Error creating task:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTask = async (taskData: any) => {
    if (!selectedTask) return;
    
    setFormLoading(true);
    try {
      await firebaseService.updateTask(selectedTask.id, taskData);
      setShowTaskForm(false);
      setSelectedTask(null);
    } catch (error) {
      setError('Failed to update task');
      console.error('Error updating task:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await firebaseService.deleteTask(taskId);
      setAnchorEl(null);
      setMenuTaskId(null);
    } catch (error) {
      setError('Failed to delete task');
      console.error('Error deleting task:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, taskId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuTaskId(taskId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTaskId(null);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskForm(true);
    handleMenuClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDueDate = (dueDate: Date) => {
    if (isToday(dueDate)) return 'Today';
    if (isTomorrow(dueDate)) return 'Tomorrow';
    return format(dueDate, 'MMM dd');
  };

  const filteredAndSortedTasks = tasks
    .filter(task => {
      if (filter === 'pending') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1" fontWeight="bold">
          My Tasks
        </Typography>
        <Box display="flex" gap={1}>
          <IconButton size="small">
            <FilterIcon />
          </IconButton>
          <IconButton size="small">
            <SortIcon />
          </IconButton>
        </Box>
      </Box>

      {filteredAndSortedTasks.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tasks yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first task to get started!
          </Typography>
        </Box>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {filteredAndSortedTasks.map((task, index) => (
            <React.Fragment key={task.id}>
              <ListItem
                sx={{
                  opacity: task.completed ? 0.6 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                <Checkbox
                  checked={task.completed}
                  onChange={(e) => handleTaskComplete(task.id, e.target.checked)}
                  sx={{ mr: 2 }}
                />
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography
                        variant="body1"
                        sx={{
                          textDecoration: task.completed ? 'line-through' : 'none',
                          fontWeight: task.completed ? 'normal' : 'medium'
                        }}
                      >
                        {task.title}
                      </Typography>
                      <Chip
                        label={task.priority}
                        size="small"
                        color={getPriorityColor(task.priority) as any}
                        variant="outlined"
                      />
                      {task.dueDate && (
                        <Chip
                          label={formatDueDate(task.dueDate)}
                          size="small"
                          color={isPast(task.dueDate) && !task.completed ? 'error' : 'default'}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      {task.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {task.description}
                        </Typography>
                      )}
                      {task.tags.length > 0 && (
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {task.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={(e) => handleMenuOpen(e, task.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {index < filteredAndSortedTasks.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: isMobile ? 90 : 30,
          right: 30,
        }}
        onClick={() => {
          setSelectedTask(null);
          setShowTaskForm(true);
        }}
      >
        <AddIcon />
      </Fab>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const task = tasks.find(t => t.id === menuTaskId);
            if (task) handleEditTask(task);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuTaskId) handleDeleteTask(menuTaskId);
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      <TaskForm
        open={showTaskForm}
        onClose={() => {
          setShowTaskForm(false);
          setSelectedTask(null);
        }}
        onSubmit={selectedTask ? handleUpdateTask : handleCreateTask}
        task={selectedTask}
        loading={formLoading}
      />
    </Box>
  );
};

export default TaskList;