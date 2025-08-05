import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  CircularProgress,
  useMediaQuery,
  Typography,
  Paper,
  Avatar,
  Button
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from './LoginScreen';
import TaskList from './TaskList';
import ChatInterface from './ChatInterface';
import CalendarView from './CalendarView';
import MainNavigation from './MainNavigation';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = createTheme({
    palette: {
      mode: prefersDarkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: prefersDarkMode ? '#121212' : '#f5f5f5',
        paper: prefersDarkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const renderCurrentView = () => {
    switch (currentTab) {
      case 0:
        return <TaskList />;
      case 1:
        return <ChatInterface />;
      case 2:
        return <CalendarView />;
      case 3:
        return <SettingsView />;
      default:
        return <TaskList />;
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <CircularProgress size={60} />
        </Box>
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2 }, py: 2 }}>
          {renderCurrentView()}
        </Container>
        <MainNavigation
          value={currentTab}
          onChange={handleTabChange}
          unreadMessages={0} // This would be calculated based on actual unread messages
        />
      </Box>
    </ThemeProvider>
  );
};

// Simple Settings View Component
const SettingsView: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <Box sx={{ pb: 10 }}>
      <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Information
        </Typography>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar src={user?.photoURL} sx={{ width: 64, height: 64 }}>
            {user?.displayName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">{user?.displayName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          App Information
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          TaskFlow v1.0.0
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Smart task management with AI assistance
        </Typography>
      </Paper>

      <Button
        variant="outlined"
        color="error"
        onClick={signOut}
        fullWidth
        sx={{ mt: 2 }}
      >
        Sign Out
      </Button>
    </Box>
  );
};

export default MainApp;