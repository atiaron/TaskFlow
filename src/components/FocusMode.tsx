/* cspell:disable */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Button,
  LinearProgress,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Slide,
  Zoom,
  Paper,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  SkipNext as SkipIcon,
  Timer as TimerIcon,
  Psychology as AIIcon,
  Spa as RelaxIcon,
  FlashOn as SprintIcon,
  VolumeOff as SilentIcon,
  VolumeUp as SoundIcon,
  Brightness4 as DarkIcon,
  NotificationsOff as NoDisturbIcon
} from '@mui/icons-material';
import { Task } from '../types';

interface FocusModeProps {
  open: boolean;
  onClose: () => void;
  currentTask?: Task;
  onTaskComplete: (taskId: string) => void;
  onTaskSkip: () => void;
}

interface FocusSession {
  type: 'pomodoro' | 'sprint' | 'deep' | 'custom';
  duration: number; // בדקות
  breakDuration: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const FocusMode: React.FC<FocusModeProps> = ({
  open,
  onClose,
  currentTask,
  onTaskComplete,
  onTaskSkip
}) => {
  const [selectedSession, setSelectedSession] = useState<FocusSession | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  
  // הגדרות
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [disturbanceBlocking, setDisturbanceBlocking] = useState(true);

  const focusSessions: FocusSession[] = [
    {
      type: 'pomodoro',
      duration: 25,
      breakDuration: 5,
      name: 'פומודורו קלאסי',
      description: '25 דק עבודה + 5 דק הפסקה',
      icon: <TimerIcon />,
      color: '#e74c3c'
    },
    {
      type: 'sprint',
      duration: 15,
      breakDuration: 3,
      name: 'ספרינט מהיר',
      description: '15 דק עבודה + 3 דק הפסקה',
      icon: <SprintIcon />,
      color: '#f39c12'
    },
    {
      type: 'deep',
      duration: 45,
      breakDuration: 10,
      name: 'עבודה עמוקה',
      description: '45 דק עבודה + 10 דק הפסקה',
      icon: <AIIcon />,
      color: '#9b59b6'
    },
    {
      type: 'custom',
      duration: 30,
      breakDuration: 5,
      name: 'מותאם אישית',
      description: 'בחר את הזמן שלך',
      icon: <RelaxIcon />,
      color: '#3498db'
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft]);

  const handleSessionEnd = () => {
    if (isBreak) {
      // סיום הפסקה - חזרה לעבודה
      setIsBreak(false);
      setTimeLeft(selectedSession!.duration * 60);
      if (soundEnabled) playNotificationSound();
    } else {
      // סיום סשן עבודה
      setSessionCount(prev => prev + 1);
      setTotalFocusTime(prev => prev + selectedSession!.duration);
      
      if (sessionCount > 0 && sessionCount % 4 === 0) {
        // הפסקה ארוכה כל 4 סשנים
        setTimeLeft(15 * 60);
      } else {
        setTimeLeft(selectedSession!.breakDuration * 60);
      }
      
      setIsBreak(true);
      if (soundEnabled) playCompletionSound();
    }
  };

  const startSession = (session: FocusSession) => {
    setSelectedSession(session);
    setTimeLeft(session.duration * 60);
    setIsActive(true);
    setIsPaused(false);
    setIsBreak(false);
    setSessionCount(0);
    setTotalFocusTime(0);

    // אפשר חסימת הפרעות
    if (disturbanceBlocking) {
      enableDisturbanceBlocking();
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const stopSession = () => {
    setIsActive(false);
    setSelectedSession(null);
    setTimeLeft(0);
    setIsPaused(false);
    setIsBreak(false);
    disableDisturbanceBlocking();
  };

  const skipCurrentPhase = () => {
    if (isBreak) {
      setIsBreak(false);
      setTimeLeft(selectedSession!.duration * 60);
    } else {
      handleSessionEnd();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!selectedSession) return 0;
    const totalSeconds = isBreak ? 
      selectedSession.breakDuration * 60 : 
      selectedSession.duration * 60;
    return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  };

  const playNotificationSound = () => {
    // השמעת צליל התראה
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(() => {});
  };

  const playCompletionSound = () => {
    // השמעת צליל השלמה
    const audio = new Audio('/sounds/completion.mp3');
    audio.play().catch(() => {});
  };

  const enableDisturbanceBlocking = () => {
    // חסימת התראות דפדפן
    if ('Notification' in window) {
      document.title = `🔴 מצב פוקוס - ${currentTask?.title || 'עבודה עמוקה'}`;
    }
  };

  const disableDisturbanceBlocking = () => {
    document.title = 'TaskFlow - מנהל המשימות החכם';
  };

  const getMotivationalMessage = () => {
    if (isBreak) {
      return ['🧘 זמן הפסקה', 'תנשום עמוק ותתרווח'];
    }
    
    const messages = [
      ['🎯 במצב פוקוס', 'תמקד והשג את המטרה'],
      ['💪 אתה חזק', 'המשך לדחוף קדימה'],
      ['🚀 באמצע הדרך', 'הביצועים שלך מדהימים'],
      ['⭐ כמעט שם', 'עוד קצת ותסיים!']
    ];
    
    const progressPercent = getProgress();
    if (progressPercent < 25) return messages[0];
    if (progressPercent < 50) return messages[1];
    if (progressPercent < 75) return messages[2];
    return messages[3];
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: darkMode ? 
            'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' :
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          minHeight: '60vh'
        }
      }}
    >
      {!selectedSession ? (
        /* בחירת מצב פוקוס */
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ textAlign: 'center', mb: 1, fontWeight: 'bold' }}>
            🎯 מצב פוקוס
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, opacity: 0.9 }}>
            בחר את סוג הסשן שמתאים לך
          </Typography>

          {currentTask && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                המשימה הנוכחית:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {currentTask.title}
              </Typography>
              {currentTask.estimatedTime && (
                <Chip
                  label={`${currentTask.estimatedTime} דק'`}
                  size="small"
                  sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              )}
            </Paper>
          )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {focusSessions.map((session) => (
              <Grid item xs={6} key={session.type}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '2px solid transparent',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      border: '2px solid rgba(255,255,255,0.3)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                    }
                  }}
                  onClick={() => startSession(session)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: session.color,
                        width: 48,
                        height: 48,
                        mx: 'auto',
                        mb: 1
                      }}
                    >
                      {session.icon}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {session.name}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {session.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* הגדרות */}
          <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>⚙️ הגדרות</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      sx={{ 
                        '& .MuiSwitch-thumb': { bgcolor: 'white' },
                        '& .MuiSwitch-track': { bgcolor: 'rgba(255,255,255,0.3)' }
                      }}
                    />
                  }
                  label={<Typography variant="body2">מצב לילה</Typography>}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      sx={{ 
                        '& .MuiSwitch-thumb': { bgcolor: 'white' },
                        '& .MuiSwitch-track': { bgcolor: 'rgba(255,255,255,0.3)' }
                      }}
                    />
                  }
                  label={<Typography variant="body2">צלילים</Typography>}
                />
              </Grid>
            </Grid>
          </Paper>
        </Box>
      ) : (
        /* מצב פוקוס פעיל */
        <Zoom in={true}>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ mb: 1, fontWeight: 'bold' }}>
              {isBreak ? '☕' : '🎯'}
            </Typography>
            
            <Typography variant="h4" sx={{ mb: 0.5 }}>
              {getMotivationalMessage()[0]}
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              {getMotivationalMessage()[1]}
            </Typography>

            {/* הצגת זמן */}
            <Paper 
              sx={{ 
                p: 4, 
                mb: 3, 
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 3
              }}
            >
              <Typography variant="h1" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                {formatTime(timeLeft)}
              </Typography>
              
              <LinearProgress
                variant="determinate"
                value={getProgress()}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  mt: 2,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': { 
                    bgcolor: isBreak ? '#27ae60' : selectedSession.color 
                  }
                }}
              />
            </Paper>

            {/* פקדי זמן */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
              <IconButton
                onClick={togglePause}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                {isPaused ? <PlayIcon /> : <PauseIcon />}
              </IconButton>
              
              <IconButton
                onClick={skipCurrentPhase}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                <SkipIcon />
              </IconButton>
              
              <IconButton
                onClick={stopSession}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                <StopIcon />
              </IconButton>
            </Box>

            {/* סטטיסטיקות סשן */}
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {sessionCount}
                </Typography>
                <Typography variant="caption">סשנים הושלמו</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {totalFocusTime}
                </Typography>
                <Typography variant="caption">דקות פוקוס</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {selectedSession.name}
                </Typography>
                <Typography variant="caption">מצב נוכחי</Typography>
              </Grid>
            </Grid>
          </Box>
        </Zoom>
      )}
    </Dialog>
  );
};

export default FocusMode;
