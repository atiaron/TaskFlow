/* cspell:disable */
import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  CssBaseline, 
  Container, 
  CircularProgress, 
  Box, 
  Typography, 
  Alert,
  Snackbar,
  Chip
} from '@mui/material';
import { 
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Warning as WarningIcon 
} from '@mui/icons-material';
import { User } from './types';
import { AuthService } from './services/AuthService';
import { EnhancedClaudeService } from './services/EnhancedClaudeService';
import { SecurityManager } from './services/SecurityManager';
import LoginScreen from './components/LoginScreen';
import MainNavigation from './components/MainNavigation';
import TaskList from './components/TaskList';
import ChatInterface from './components/ChatInterface';
import SessionManager from './components/SessionManager';
import CalendarView from './components/CalendarView';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import SystemStatus from './components/SystemStatus';
import QuickStats from './components/QuickStats';
import PWAInstallButton from './components/PWAInstallButton';
import NetworkStatus from './components/NetworkStatus';
import { usePWA } from './hooks/usePWA';

const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: { 
      main: '#4A90E2',
      light: '#6BA3E8',
      dark: '#3A7BD5'
    },
    secondary: { 
      main: '#7ED321',
      light: '#9BDD47',
      dark: '#6BB51A'
    },
    background: {
      default: '#FAFBFC',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#2C3E50',
      secondary: '#7F8C8D'
    }
  },
  typography: {
    fontFamily: '"SF Pro Display", "Segoe UI", "Roboto", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem'
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.1rem'
    },
    body1: {
      fontSize: '0.95rem'
    },
    body2: {
      fontSize: '0.85rem'
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid #F1F3F4'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 500
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500
        }
      }
    }
  }
});

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>('tasks');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const { isOnline, isInstalled } = usePWA();

  useEffect(() => {
    console.log('🚀 App starting - setting up auth listener and services');
    
    // הסתרת מסך הטעינה
    const hideLoadingScreen = () => {
      document.body.classList.add('app-loaded');
    };
    
    // הגדר listener לשינויי אימות
    const unsubscribe = AuthService.onAuthStateChanged(async (user: User | null) => {
      setUser(user);
      
      if (user) {
        // אתחול השירותים החדשים (אם יש להם פונקציות initialize)
        try {
          // await SecurityManager.initialize(user.id);
          // await EnhancedClaudeService.initialize(user);
          console.log('✅ All services ready for user:', user.email);
        } catch (error) {
          console.error('❌ Failed to initialize services:', error);
          setAppError('שגיאה באתחול השירותים');
        }
      } else {
        // ניקוי בעת יציאה (אם יש להם פונקציות cleanup)
        // SecurityManager.cleanup();
        // EnhancedClaudeService.cleanup();
      }
      
      setLoading(false);
      hideLoadingScreen();
    });

    // נקה את הlisteners כשהcomponent נמחק
    return () => {
      unsubscribe();
    };
  }, []);

  const handleTasksUpdate = () => {
    // הפונקציה הזו לא צריכה לעשות כלום יותר!
    // Firestore real-time listeners יטפלו בהכל
    console.log('📝 Tasks updated - Firestore will handle the sync');
  };

  const handleTaskCreated = (task: any) => {
    console.log('🆕 New task created:', task.title);
    // אפשר להוסיף התראות או אנימציות כאן
  };

  const handleChatSessionChange = (session: any) => {
    const sessionId = session?.id || session;
    setCurrentChatId(sessionId);
    if (sessionId) {
      setCurrentTab('chat');
    }
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LoadingScreen 
            message="מאתחל שירותים ומערכות אבטחה..."
            showProgress={false}
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  if (appError) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: 2
        }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {appError}
          </Alert>
          <Typography variant="body2">
            אנא רענן את הדף או נסה שוב מאוחר יותר
          </Typography>
        </Container>
      </ThemeProvider>
    );
  }

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ position: 'relative', minHeight: '100vh' }}>
          {/* Network Status */}
          <NetworkStatus />
          
          {/* Main Content */}
          <Box sx={{ pt: !isOnline ? '48px' : 0 }}>
            <LoginScreen />
            
            {/* PWA Install Button בדף הlogin */}
            {!isInstalled && (
              <Box
                sx={{
                  position: 'fixed',
                  bottom: 20,
                  right: 20,
                  zIndex: 1000
                }}
              >
                <PWAInstallButton />
              </Box>
            )}
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'tasks':
        return (
          <Box>
            <QuickStats user={user} isCompact={false} />
            <TaskList 
              user={user} 
              onTasksUpdate={handleTasksUpdate}
              onTaskCreated={handleTaskCreated}
              enableAICreation={true}
              enableSearch={true}
              variant="full"
            />
          </Box>
        );
      case 'chat':
        return (
          <Box sx={{ position: 'relative', height: '100vh' }}>
            <ChatInterface 
              user={user} 
              onTasksUpdate={handleTasksUpdate}
              sessionId={currentChatId || undefined}
              onSessionChange={handleChatSessionChange}
            />
            {showSessionManager && (
              <SessionManager
                open={showSessionManager}
                onSessionSelect={handleChatSessionChange}
                onClose={() => setShowSessionManager(false)}
                onSessionCreate={() => setCurrentChatId(null)}
                selectedSessionId={currentChatId || undefined}
              />
            )}
          </Box>
        );
      case 'sessions':
        return (
          <SessionManager
            open={true}
            onSessionSelect={handleChatSessionChange}
            onClose={() => setCurrentTab('chat')}
            onSessionCreate={() => setCurrentChatId(null)}
            selectedSessionId={currentChatId || undefined}
          />
        );
      case 'calendar':
        return <CalendarView user={user} />;
      default:
        return (
          <TaskList 
            user={user} 
            onTasksUpdate={handleTasksUpdate}
            onTaskCreated={handleTaskCreated}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', position: 'relative' }}>
          {/* Network Status */}
          <NetworkStatus />
          
          {/* אינדיקטור מצב פיתוח */}
          <Box
            sx={{
              position: 'fixed',
              top: isOnline ? 8 : 48,
              right: 8,
              zIndex: 1200,
              display: 'flex',
              gap: 1,
              alignItems: 'center'
            }}
          >
            {process.env.NODE_ENV === 'development' && (
              <Chip
                label="DEV"
                color="secondary"
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
            <SystemStatus isOnline={isOnline} user={user} />
            
            {/* PWA Install Button למשתמשים מחוברים */}
            {!isInstalled && (
              <PWAInstallButton />
            )}
          </Box>
          
          <Box sx={{ paddingTop: isOnline ? 0 : '48px' }}>
            {renderCurrentTab()}
          </Box>
          
          <MainNavigation 
            currentTab={currentTab} 
            onTabChange={setCurrentTab}
            user={user}
          />
          
          {/* Snackbar לhודעות מערכת */}
          <Snackbar
            open={!!appError}
            autoHideDuration={6000}
            onClose={() => setAppError(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert onClose={() => setAppError(null)} severity="error">
              {appError}
            </Alert>
          </Snackbar>
        </Box>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;