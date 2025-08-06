/* cspell:disable */
import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Button, Box, Alert } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { AuthService } from '../services/AuthService';

const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state === 'taskflow-auth') {
      console.log('🔍 OAuth callback detected, processing...');
      setLoading(true);
      
      AuthService.handleOAuthCallback(code)
        .then(() => {
          console.log('✅ OAuth callback processed successfully');
          // Clear the URL parameters
          window.history.replaceState({}, document.title, '/');
        })
        .catch((error) => {
          console.error('❌ OAuth callback failed:', error);
          setError('התחברות נכשלה. אנא נסה שוב.');
          setLoading(false);
        });
      return;
    }

    // Initialize Google Auth
    const initGoogle = async () => {
      console.log('🔍 LoginScreen: Initializing Google Auth...');
      const ready = await AuthService.initializeGoogleAuth();
      setGoogleReady(ready);
      
      if (!ready) {
        setError('Failed to initialize Google Authentication. Please check your internet connection.');
      }
    };
    
    initGoogle();
  }, []);



  // Temporary bypass for development - simulate successful login
  const handleEmulatorLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create a test user
      const testUser = {
        id: 'test-user-123',
        name: 'Test User (מפתח)',
        email: 'test@taskflow.dev',
        picture: 'https://via.placeholder.com/150',
        settings: {
          theme: 'light',
          language: 'he',
          notifications: true
        }
      };

      localStorage.setItem('taskflow-user', JSON.stringify(testUser));
      localStorage.setItem('auth_token', 'test-token-123');
      
      // Notify listeners
      AuthService.onAuthStateChanged(() => {});
      
      console.log('✅ Emulator login successful');
      
      // Force re-render
      window.location.reload();
      
    } catch (error: any) {
      console.error('❌ Emulator login failed:', error);
      setError('בדיקת התחברות נכשלה');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log('🖱️ Button clicked - handleGoogleLogin called');
    console.log('🔍 Google ready:', googleReady);
    
    if (!googleReady) {
      setError('Google Authentication not ready. Please refresh the page.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Calling AuthService.signInWithGoogle...');
      await AuthService.signInWithGoogle();
      console.log('✅ Authentication successful');
    } catch (error: any) {
      console.error('❌ Authentication failed:', error);
      let errorMessage = 'התחברות נכשלה. נסה שוב.';
      
      if (error.message === 'popup_failed_to_open' || error.message === 'popup_blocked') {
        errorMessage = '🚫 החלון הקופץ נחסם על ידי הדפדפן. אנא:\n\n' +
                     '1. אפשר חלונות קופצים עבור האתר הזה\n' +
                     '2. לחץ על האייקון 🔒 ליד כתובת האתר\n' +
                     '3. אפשר "חלונות קופצים והפניות"\n' +
                     '4. רענן את הדף ונסה שוב';
      } else if (error.message?.includes('popup_closed_by_user')) {
        errorMessage = 'החלון נסגר. אנא נסה שוב ואשר את ההתחברות.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <Paper sx={{ p: 4, width: '100%', textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          TaskFlow
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          העוזר האישי החכם שלך
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: 'right', whiteSpace: 'pre-line' }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={loading || !googleReady}
          sx={{ py: 2, px: 4, fontSize: '1.1rem' }}
        >
          {loading ? 'מתחבר...' : 'התחבר עם Google'}
        </Button>

        {/* Development Mode Button */}
        <Button
          variant="outlined"
          size="large"
          onClick={handleEmulatorLogin}
          disabled={loading}
          sx={{ py: 2, px: 4, fontSize: '1.1rem', mt: 2 }}
        >
          🔧 כניסה לפיתוח (Emulator)
        </Button>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            🤖 AI חכם לניהול משימות
          </Typography>
          <Typography variant="body2" color="text.secondary">
            🔄 סנכרון בין מכשירים
          </Typography>
          <Typography variant="body2" color="text.secondary">
            🎯 תכנון אישי מותאם
          </Typography>
        </Box>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 2, p: 1, bgcolor: 'info.light', borderRadius: 1, fontSize: '0.8rem' }}>
            <Typography variant="caption">
              Debug: Google Ready: {googleReady ? '✅' : '❌'} | 
              Client ID: {process.env.REACT_APP_GOOGLE_CLIENT_ID ? '✅' : '❌'}
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Emulator warning */}
      {process.env.NODE_ENV === 'development' && (
        <Typography 
          variant="caption" 
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            left: '50%', 
            transform: 'translateX(-50%)',
            color: 'orange',
            bgcolor: 'rgba(255,165,0,0.1)',
            p: 1,
            borderRadius: 1
          }}
        >
          Running in emulator mode. Do not use with production credentials.
        </Typography>
      )}
    </Container>
  );
};

export default LoginScreen;
