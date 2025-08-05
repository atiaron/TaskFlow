import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Google as GoogleIcon, Task as TaskIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen: React.FC = () => {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await signIn();
    } catch (error) {
      setError('Failed to sign in. Please try again.');
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <Box sx={{ mb: 4 }}>
            <TaskIcon sx={{ fontSize: 64, mb: 2 }} />
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              component="h1"
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              TaskFlow
            </Typography>
            <Typography
              variant="h6"
              sx={{ opacity: 0.9, mb: 3 }}
            >
              Smart Task Management with AI
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={loading}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1.1rem',
              backgroundColor: 'white',
              color: '#1976d2',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              '&:disabled': {
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                color: 'rgba(25, 118, 210, 0.7)',
              }
            }}
          >
            {loading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          <Box sx={{ mt: 4, opacity: 0.8 }}>
            <Typography variant="body2">
              Organize your tasks • Get AI assistance • Stay productive
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginScreen;