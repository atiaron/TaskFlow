import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  CssBaseline, 
  Container, 
  CircularProgress, 
  Box, 
  Typography 
} from '@mui/material';
import { User } from './types';
import LoginScreen from './components/LoginScreen';
import TaskList from './components/TaskList';
import ErrorBoundary from './components/ErrorBoundary';
import AuthProvider from './services/AuthProvider';
import DebugBar from './components/DebugBar';

// Simple theme
const theme = createTheme({
  palette: {
    primary: { main: '#4A90E2' },
    secondary: { main: '#7ED321' },
    background: { default: '#FAFBFC', paper: '#FFFFFF' }
  }
});

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Focus management
  const mainTitleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const startTime = performance.now();
    console.log('🚀 App starting...');
    console.log('🎯 Auth mode:', AuthProvider.getAuthMode());
    
    // Check if guest mode is active
    const guestModeActive = sessionStorage.getItem('guestModeActive') === 'true';
    const guestModeEnabled = process.env.REACT_APP_GUEST_MODE === '1';
    
    if (guestModeActive && guestModeEnabled) {
      console.log('👤 Guest mode detected, skipping auth...');
      setIsGuestMode(true);
      setLoading(false);
      document.body.classList.add('app-loaded');
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      console.log(`⚡ App loaded in guest mode in ${loadTime.toFixed(2)}ms`);
      return;
    }
    
    let unsubscribe = () => {};
    let safetyTimer: ReturnType<typeof setTimeout>;

    // Fail-safe: גם אם שום callback לא נורה תוך 5 שניות – אל תיתקע על "טוען"
    safetyTimer = setTimeout(() => {
      console.warn('⏱️ Safety release: setLoading(false) after 5s');
      setLoading(false);
    }, 5000);
    
    // Initialize auth and set up listener
    AuthProvider.initializeGoogleAuth().then(() => {
      console.log('✅ Auth initialized');
      
      // Set up auth state listener
      unsubscribe = AuthProvider.onAuthStateChanged((user) => {
        try {
          setUser(user);
          if (user) {
            console.log('✅ User logged in:', user.email);
          } else {
            console.log('👤 No user logged in');
          }
        } catch (err) {
          console.error('❌ Error setting user state:', err);
        } finally {
          // תמיד לשחרר loading
          setLoading(false);
          clearTimeout(safetyTimer);
          
          // **FIX: הסתר את הHTML loading screen**
          document.body.classList.add('app-loaded');
          
          // Calculate load time correctly
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          if (loadTime > 0) {
            console.log(`⚡ App loaded in ${loadTime.toFixed(2)}ms`);
          }
        }
      });
      
    }).catch((error) => {
      console.error('❌ Auth initialization failed:', error);
      setLoading(false);
      clearTimeout(safetyTimer);
      
      // **FIX: הסתר את הHTML loading screen גם בשגיאה**
      document.body.classList.add('app-loaded');
      
      // Calculate load time even on error
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      if (loadTime > 0) {
        console.log(`⚡ App failed to load in ${loadTime.toFixed(2)}ms`);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe && unsubscribe();
    };
  }, []);

  // Focus management - focus on main title when user logs in or enters guest mode
  useEffect(() => {
    if ((user || isGuestMode) && !loading && mainTitleRef.current) {
      mainTitleRef.current.focus();
    }
  }, [user, isGuestMode, loading]);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          flexDirection="column"
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            טוען את TaskFlow...
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
            מצב: {AuthProvider.getAuthMode()}
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  // Show login screen if no user AND not in guest mode
  if (!user && !isGuestMode) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* אזור הכרזה גלובלי לשגיאות/הודעות */}
        <div 
          id="a11y-announcer" 
          role="status" 
          aria-live="polite" 
          aria-atomic="true" 
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden'
          }} 
        />
        <LoginScreen />
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* אזור הכרזה גלובלי לשגיאות/הודעות */}
        <div 
          id="a11y-announcer" 
          role="status" 
          aria-live="polite" 
          aria-atomic="true" 
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden'
          }} 
        />
        <Container maxWidth="lg">
          <Box sx={{ py: 3 }}>
            <Typography 
              variant="h4" 
              gutterBottom
              ref={mainTitleRef}
              tabIndex={-1}
              component="h1"
            >
              {user ? `שלום ${user.display_name || user.email}!` : 'שלום אורח!'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.7 }}>
              מצב אותנטיקציה: {AuthProvider.getAuthMode()} | 
              {user ? `משתמש: ${user.email} | ID: ${user.id}` : 'מצב אורח'}
            </Typography>
            <TaskList user={user || null} />
          </Box>
        </Container>
        <DebugBar />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
