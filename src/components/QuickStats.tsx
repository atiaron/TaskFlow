import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  LinearProgress
} from '@mui/material';
import {
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  TrendingUp as ProgressIcon,
  Expand as ExpandIcon,
  ExpandLess as CollapseIcon,
  Today as TodayIcon,
  Warning as OverdueIcon
} from '@mui/icons-material';
import { FirebaseService } from '../services/FirebaseService';
import { Task, User } from '../types';

interface QuickStatsProps {
  user: User;
  isCompact?: boolean;
}

interface StatsData {
  total: number;
  completed: number;
  pending: number;
  todayTasks: number;
  overdue: number;
  completionRate: number;
  todayCompleted: number;
}

const QuickStats: React.FC<QuickStatsProps> = ({ user, isCompact = false }) => {
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    completed: 0,
    pending: 0,
    todayTasks: 0,
    overdue: 0,
    completionRate: 0,
    todayCompleted: 0
  });
  const [expanded, setExpanded] = useState(!isCompact);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);

    // Real-time listener לעדכון סטטיסטיקות בזמן אמת
    const unsubscribe = FirebaseService.subscribeToUserTasks(user.id, (tasks: Task[]) => {
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const completed = tasks.filter((t: Task) => t.completed);
        const pending = tasks.filter((t: Task) => !t.completed);
        
        const todayTasks = tasks.filter((t: Task) => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate >= today && dueDate < tomorrow;
        });

        const overdue = tasks.filter((t: Task) => {
          if (!t.dueDate || t.completed) return false;
          return new Date(t.dueDate) < now;
        });

        const todayCompleted = completed.filter((t: Task) => {
          if (!t.updatedAt) return false;
          const completedDate = new Date(t.updatedAt);
          return completedDate >= today && completedDate < tomorrow;
        });

        const completionRate = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0;

        setStats({
          total: tasks.length,
          completed: completed.length,
          pending: pending.length,
          todayTasks: todayTasks.length,
          overdue: overdue.length,
          completionRate,
          todayCompleted: todayCompleted.length
        });
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Error processing stats:', error);
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, [user.id]);

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'warning';
    return 'error';
  };

  const StatItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: number;
    color?: string;
    subtitle?: string;
  }> = ({ icon, label, value, color = 'text.primary', subtitle }) => (
    <Box sx={{ textAlign: 'center', p: 1 }}>
      <Box sx={{ color, mb: 0.5 }}>
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={600} sx={{ color }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {subtitle && (
        <Typography variant="caption" display="block" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ProgressIcon color="primary" />
          <Typography variant="subtitle1">טוען סטטיסטיקות...</Typography>
        </Box>
        <LinearProgress sx={{ mt: 1 }} />
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
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
          <ProgressIcon />
          <Typography variant="subtitle1" fontWeight={600}>
            סיכום משימות
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`${Math.round(stats.completionRate)}%`}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 600
            }}
          />
          
          {isCompact && (
            <Tooltip title={expanded ? 'צמצם' : 'הרחב'}>
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{ color: 'white' }}
              >
                {expanded ? <CollapseIcon /> : <ExpandIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Stats Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {/* Main Stats Grid */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <StatItem
                icon={<TaskIcon fontSize="large" />}
                label="סך הכל"
                value={stats.total}
                color="primary.main"
              />
            </Grid>
            <Grid item xs={3}>
              <StatItem
                icon={<CompletedIcon fontSize="large" />}
                label="הושלמו"
                value={stats.completed}
                color="success.main"
              />
            </Grid>
            <Grid item xs={3}>
              <StatItem
                icon={<PendingIcon fontSize="large" />}
                label="בהמתנה"
                value={stats.pending}
                color="warning.main"
              />
            </Grid>
            <Grid item xs={3}>
              <StatItem
                icon={<OverdueIcon fontSize="large" />}
                label="באיחור"
                value={stats.overdue}
                color="error.main"
              />
            </Grid>
          </Grid>

          {/* Progress Bar */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                אחוז השלמה כללי
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {Math.round(stats.completionRate)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats.completionRate}
              color={getCompletionColor(stats.completionRate)}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200'
              }}
            />
          </Box>

          {/* Today's Stats */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1.5,
              bgcolor: 'background.default',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TodayIcon color="primary" fontSize="small" />
              <Typography variant="body2" fontWeight={500}>
                היום
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {stats.todayCompleted} הושלמו
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.todayTasks} למועד
              </Typography>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default QuickStats;
