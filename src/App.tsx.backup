import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, CircularProgress, Box, Typography } from '@mui/material';
import { User } from './types';
import { AuthService } from './services/AuthService';
import LoginScreen from './components/LoginScreen';
import MainNavigation from './components/MainNavigation';
import TaskList from './components/TaskList';
import ChatInterface from './components/ChatInterface';
import CalendarView from './components/CalendarView';
import JokeGenerator from './components/JokeGenerator';

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
  },
});

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>('tasks');

  useEffect(() => {
    console.log('🚀 App starting - setting up auth listener');
    
    // הגדר listener לשינויי אימות
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    // נקה את הlistener כשהcomponent נמחק
    return () => unsubscribe();
  }, []);

  const handleTasksUpdate = () => {
    // הפונקציה הזו לא צריכה לעשות כלום יותר!
    // Firestore real-time listeners יטפלו בהכל
    console.log('📝 Tasks updated - Firestore will handle the sync');
  };

  if (loading) {
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
          <CircularProgress size={60} />
          <Typography variant="h6">טוען את TaskFlow...</Typography>
        </Container>
      </ThemeProvider>
    );
  }

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginScreen />
      </ThemeProvider>
    );
  }

  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'tasks':
        return <TaskList user={user} onTasksUpdate={handleTasksUpdate} />;
      case 'chat':
        return <ChatInterface user={user} onTasksUpdate={handleTasksUpdate} />;
      case 'calendar':
        return <CalendarView user={user} />;
      case 'jokes':
        return <JokeGenerator user={user} />;
      default:
        return <TaskList user={user} onTasksUpdate={handleTasksUpdate} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {renderCurrentTab()}
        <MainNavigation 
          currentTab={currentTab} 
          onTabChange={setCurrentTab}
          user={user}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;