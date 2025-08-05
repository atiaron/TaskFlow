import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
  Typography,
  LinearProgress,
  IconButton,
  Paper,
  Grid
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Timer,
  Psychology,
  Spa,
  FlashOn
} from '@mui/icons-material';

interface WorkMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  duration: number; // בדקות
  breakDuration: number; // בדקות
  color: string;
}

const WorkModes: React.FC<{ onTaskFocus: (taskId: string) => void }> = ({ onTaskFocus }) => {
  const [selectedMode, setSelectedMode] = useState<WorkMode | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  const workModes: WorkMode[] = [
    {
      id: 'pomodoro',
      name: 'פומודורו',
      description: '25 דק עבודה + 5 דק הפסקה',
      icon: <Timer />,
      duration: 25,
      breakDuration: 5,
      color: '#e74c3c'
    },
    {
      id: 'deep_work',
      name: 'עבודה עמוקה',
      description: '90 דק עבודה + 20 דק הפסקה',
      icon: <Psychology />,
      duration: 90,
      breakDuration: 20,
      color: '#3498db'
    },
    {
      id: 'sprint',
      name: 'ספרינט',
      description: '15 דק עבודה מהירה + 5 דק הפסקה',
      icon: <FlashOn />,
      duration: 15,
      breakDuration: 5,
      color: '#f39c12'
    },
    {
      id: 'mindful',
      name: 'עבודה מיינדפול',
      description: '45 דק עבודה + 15 דק הפסקה',
      icon: <Spa />,
      duration: 45,
      breakDuration: 15,
      color: '#27ae60'
    }
  ];

  // ⏰ טיימר חכם
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            handleTimerComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const startMode = (mode: WorkMode) => {
    setSelectedMode(mode);
    setTimeLeft(mode.duration * 60); // המר לשניות
    setIsActive(true);
    setIsBreak(false);
    
    // הודעת התחלה
    if (Notification.permission === 'granted') {
      new Notification(`🎯 ${mode.name} התחיל!`, {
        body: `${mode.duration} דקות של עבודה ממוקדת`,
        icon: '/icon-192x192.png'
      });
    }
  };

  const handleTimerComplete = () => {
    if (!selectedMode) return;

    setIsActive(false);
    
    if (!isBreak) {
      // סיום עבודה - התחל הפסקה
      setIsBreak(true);
      setTimeLeft(selectedMode.breakDuration * 60);
      setSessionCount(prev => prev + 1);
      
      if (Notification.permission === 'granted') {
        new Notification('🎉 מצוין! זמן להפסקה', {
          body: `${selectedMode.breakDuration} דקות הפסקה`,
          icon: '/icon-192x192.png'
        });
      }
      
      setTimeout(() => setIsActive(true), 1000);
    } else {
      // סיום הפסקה
      setIsBreak(false);
      
      if (Notification.permission === 'granted') {
        new Notification('⚡ חזרנו לעבודה!', {
          body: `עוד ${selectedMode.duration} דקות של פוקוס`,
          icon: '/icon-192x192.png'
        });
      }
      
      // התחל סשן עבודה חדש אוטומטית
      setTimeLeft(selectedMode.duration * 60);
      setTimeout(() => setIsActive(true), 1000);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (!selectedMode) return 0;
    const totalDuration = isBreak ? selectedMode.breakDuration * 60 : selectedMode.duration * 60;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  return (
    <Box>
      {/* בחירת מצב עבודה */}
      {!selectedMode && (
        <Grid container spacing={2}>
          {workModes.map(mode => (
            <Grid item xs={6} key={mode.id}>
              <Paper
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  textAlign: 'center',
                  border: `2px solid ${mode.color}`,
                  '&:hover': { bgcolor: 'grey.50' }
                }}
                onClick={() => startMode(mode)}
              >
                <Box sx={{ color: mode.color, mb: 1 }}>
                  {mode.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {mode.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mode.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* טיימר פעיל */}
      {selectedMode && (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: selectedMode.color, color: 'white' }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {isBreak ? '☕ הפסקה' : `🎯 ${selectedMode.name}`}
          </Typography>
          
          <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
            {formatTime(timeLeft)}
          </Typography>
          
          <LinearProgress
            variant="determinate"
            value={getProgress()}
            sx={{
              height: 8,
              borderRadius: 4,
              mb: 2,
              bgcolor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': { bgcolor: 'white' }
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
            <IconButton
              onClick={() => setIsActive(!isActive)}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}
            >
              {isActive ? <Pause /> : <PlayArrow />}
            </IconButton>
            
            <IconButton
              onClick={() => {
                setSelectedMode(null);
                setIsActive(false);
                setTimeLeft(0);
                setIsBreak(false);
              }}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}
            >
              <Stop />
            </IconButton>
          </Box>
          
          <Typography variant="body2">
            סשן #{sessionCount + 1}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};