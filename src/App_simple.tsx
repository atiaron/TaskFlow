import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  CssBaseline, 
  Container, 
  CircularProgress, 
  Box, 
  Typography 
} from '@mui/material';
import { User } from './types';
import SimpleLogin from './components/SimpleLogin';
import TaskList from './components/TaskList';
import ErrorBoundary from './components/ErrorBoundary';

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

  useEffect(() => {
    console.log('🚀 App starting...');
    
    // Check for stored user
    const storedUser = sessionStorage.getItem('taskflow_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log('✅ User loaded from sessionStorage:', userData.email);
      } catch (error) {
        console.error('❌ Failed to parse stored user:', error);
        sessionStorage.removeItem('taskflow_user');
      }
    }
    
    // Set loading to false after a short delay
    setTimeout(() => setLoading(false), 500);
  }, []);

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
        </Box>
      </ThemeProvider>
    );
  }

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="sm">
          <SimpleLogin onLogin={(userData) => {
            setUser(userData);
            // Store user in sessionStorage
            sessionStorage.setItem('taskflow_user', JSON.stringify(userData));
            console.log('✅ User logged in:', userData.email);
          }} />
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg">
          <Box sx={{ py: 3 }}>
            <Typography variant="h4" gutterBottom>
              שלום {user.name || user.email}!
            </Typography>
            <TaskList />
          </Box>
        </Container>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
