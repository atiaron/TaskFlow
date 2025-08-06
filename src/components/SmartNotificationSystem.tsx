/* cspell:disable */
import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Box,
  Avatar,
  Typography,
  Slide,
  Grow,
  Zoom,
  IconButton,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Psychology as AIIcon,
  Lightbulb as TipIcon,
  TrendingUp as ProgressIcon,
  Close as CloseIcon,
  Celebration as CelebrationIcon,
  LocalFireDepartment as StreakIcon,
  Star as AchievementIcon
} from '@mui/icons-material';

interface SmartNotification {
  id: string;
  type: 'success' | 'achievement' | 'tip' | 'ai_insight' | 'streak' | 'celebration';
  title: string;
  message: string;
  icon?: React.ReactNode;
  duration?: number;
  actionText?: string;
  onAction?: () => void;
  progress?: number;
  metadata?: any;
}

interface SmartNotificationSystemProps {
  notifications: SmartNotification[];
  onDismiss: (id: string) => void;
}

const SmartNotificationSystem: React.FC<SmartNotificationSystemProps> = ({ 
  notifications, 
  onDismiss 
}) => {
  const [currentNotification, setCurrentNotification] = useState<SmartNotification | null>(null);
  const [queue, setQueue] = useState<SmartNotification[]>([]);

  useEffect(() => {
    setQueue(notifications);
  }, [notifications]);

  useEffect(() => {
    if (!currentNotification && queue.length > 0) {
      const next = queue[0];
      setCurrentNotification(next);
      setQueue(prev => prev.slice(1));
      
      // Auto dismiss after duration
      const duration = next.duration || 4000;
      setTimeout(() => {
        handleDismiss(next.id);
      }, duration);
    }
  }, [currentNotification, queue]);

  const handleDismiss = (id: string) => {
    setCurrentNotification(null);
    onDismiss(id);
  };

  const getNotificationComponent = (notification: SmartNotification) => {
    switch (notification.type) {
      case 'celebration':
        return (
          <Zoom in={true}>
            <Alert
              severity="success"
              icon={<CelebrationIcon sx={{ fontSize: 28 }} />}
              sx={{
                background: 'linear-gradient(135deg, #ff6b6b, #feca57)',
                color: 'white',
                fontWeight: 'bold',
                '& .MuiAlert-icon': { color: 'white' },
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(255, 107, 107, 0.3)'
              }}
              action={
                <IconButton size="small" onClick={() => handleDismiss(notification.id)} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              }
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {notification.title}
                </Typography>
                <Typography variant="body2">
                  {notification.message}
                </Typography>
              </Box>
            </Alert>
          </Zoom>
        );

      case 'achievement':
        return (
          <Grow in={true}>
            <Alert
              severity="info"
              icon={<AchievementIcon sx={{ fontSize: 28, color: '#f39c12' }} />}
              sx={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
              }}
              action={
                <IconButton size="small" onClick={() => handleDismiss(notification.id)} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              }
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  🏆 {notification.title}
                </Typography>
                <Typography variant="body2">
                  {notification.message}
                </Typography>
                {notification.progress && (
                  <LinearProgress
                    variant="determinate"
                    value={notification.progress}
                    sx={{
                      mt: 1,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#f39c12' }
                    }}
                  />
                )}
              </Box>
            </Alert>
          </Grow>
        );

      case 'streak':
        return (
          <Slide direction="up" in={true}>
            <Alert
              severity="warning"
              icon={<StreakIcon sx={{ fontSize: 28 }} />}
              sx={{
                background: 'linear-gradient(135deg, #ff9a56, #ffad56)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(255, 154, 86, 0.3)'
              }}
              action={
                <IconButton size="small" onClick={() => handleDismiss(notification.id)} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              }
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    🔥 {notification.title}
                  </Typography>
                  <Typography variant="body2">
                    {notification.message}
                  </Typography>
                </Box>
                {notification.metadata?.streakCount && (
                  <Chip
                    label={`${notification.metadata.streakCount} ימים`}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                )}
              </Box>
            </Alert>
          </Slide>
        );

      case 'ai_insight':
        return (
          <Grow in={true}>
            <Alert
              severity="info"
              icon={<AIIcon sx={{ fontSize: 28 }} />}
              sx={{
                background: 'linear-gradient(135deg, #a8edea, #fed6e3)',
                color: '#2c3e50',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(168, 237, 234, 0.3)'
              }}
              action={
                <IconButton size="small" onClick={() => handleDismiss(notification.id)} sx={{ color: '#2c3e50' }}>
                  <CloseIcon />
                </IconButton>
              }
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    🤖 {notification.title}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {notification.message}
                </Typography>
                {notification.actionText && notification.onAction && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={notification.actionText}
                      onClick={notification.onAction}
                      sx={{
                        bgcolor: '#667eea',
                        color: 'white',
                        '&:hover': { bgcolor: '#5a67d8' }
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Alert>
          </Grow>
        );

      case 'tip':
        return (
          <Slide direction="left" in={true}>
            <Alert
              severity="info"
              icon={<TipIcon sx={{ fontSize: 28 }} />}
              sx={{
                background: 'linear-gradient(135deg, #74b9ff, #0984e3)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(116, 185, 255, 0.3)'
              }}
              action={
                <IconButton size="small" onClick={() => handleDismiss(notification.id)} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              }
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  💡 {notification.title}
                </Typography>
                <Typography variant="body2">
                  {notification.message}
                </Typography>
              </Box>
            </Alert>
          </Slide>
        );

      default:
        return (
          <Alert
            severity="success"
            onClose={() => handleDismiss(notification.id)}
            sx={{ borderRadius: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {notification.title}
            </Typography>
            <Typography variant="body2">
              {notification.message}
            </Typography>
          </Alert>
        );
    }
  };

  if (!currentNotification) return null;

  return (
    <Snackbar
      open={!!currentNotification}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ top: { xs: 16, sm: 24 } }}
    >
      <Box>
        {getNotificationComponent(currentNotification)}
      </Box>
    </Snackbar>
  );
};

// Hook לשימוש נוח במערכת ההודעות
export const useSmartNotifications = () => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);

  const addNotification = (notification: Omit<SmartNotification, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // פונקציות נוחות לסוגי הודעות שונים
  const showSuccess = (title: string, message: string) => {
    addNotification({
      type: 'success',
      title,
      message,
      duration: 3000
    });
  };

  const showAchievement = (title: string, message: string, progress?: number) => {
    addNotification({
      type: 'achievement',
      title,
      message,
      progress,
      duration: 5000
    });
  };

  const showCelebration = (title: string, message: string) => {
    addNotification({
      type: 'celebration',
      title,
      message,
      duration: 4000
    });
  };

  const showStreak = (title: string, message: string, streakCount: number) => {
    addNotification({
      type: 'streak',
      title,
      message,
      metadata: { streakCount },
      duration: 4000
    });
  };

  const showAIInsight = (title: string, message: string, actionText?: string, onAction?: () => void) => {
    addNotification({
      type: 'ai_insight',
      title,
      message,
      actionText,
      onAction,
      duration: 6000
    });
  };

  const showTip = (title: string, message: string) => {
    addNotification({
      type: 'tip',
      title,
      message,
      duration: 5000
    });
  };

  return {
    notifications,
    removeNotification,
    showSuccess,
    showAchievement,
    showCelebration,
    showStreak,
    showAIInsight,
    showTip
  };
};

export default SmartNotificationSystem;
