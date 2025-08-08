import React from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import AuthProvider from '../services/AuthProvider';

const SimpleLogin = ({ onLogin }: { onLogin: () => void }) => {
  const handleLogin = async () => {
    console.log('🎉 Simple login clicked!');
    
    try {
      if (AuthProvider.isDevelopmentMode()) {
        // In development mode, use MockAuth
        console.log('🔧 Development mode - using MockAuth');
        // MockAuth will auto-login and trigger onAuthStateChanged
      } else {
        // In production mode, use Firebase Google Auth
        console.log('🚀 Production mode - using Firebase Google Auth');
        await AuthProvider.signInWithGoogle();
      }
      
      // Call parent login handler
      onLogin();
    } catch (error) {
      console.error('❌ Login failed:', error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3
      }}>
        <Typography variant="h2" component="h1" gutterBottom>
          TaskFlow
        </Typography>
        
        <Typography variant="h6" color="text.secondary" align="center">
          {AuthProvider.isDevelopmentMode() ? 'Development Mode' : 'Production Mode'}
        </Typography>
        
        <Button 
          variant="contained" 
          size="large"
          onClick={handleLogin}
          sx={{ 
            px: 4, 
            py: 2,
            fontSize: '1.1rem'
          }}
        >
          {AuthProvider.isDevelopmentMode() ? 'התחבר (פיתוח)' : 'התחבר עם Google'}
        </Button>
        
        <Typography variant="body2" color="text.secondary" align="center">
          {AuthProvider.isDevelopmentMode() 
            ? 'לחץ כדי להיכנס במצב פיתוח' 
            : 'לחץ כדי להיכנס עם חשבון Google'
          }
        </Typography>
        
        <Typography variant="caption" color="text.secondary" align="center">
          Auth Mode: {AuthProvider.getAuthMode()}
        </Typography>
      </Box>
    </Container>
  );
};

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3
      }}>
        <Typography variant="h2" component="h1" gutterBottom>
          TaskFlow
        </Typography>
        
        <Typography variant="h6" color="text.secondary" align="center">
          Development Mode - Simple Login
        </Typography>
        
        <Button 
          variant="contained" 
          size="large"
          onClick={handleLogin}
          sx={{ 
            px: 4, 
            py: 2,
            fontSize: '1.1rem'
          }}
        >
          {AuthProvider.isDevelopmentMode() ? 'התחבר (פיתוח)' : 'התחבר עם Google'}
        </Button>
        
        <Typography variant="body2" color="text.secondary" align="center">
          {AuthProvider.isDevelopmentMode() 
            ? 'לחץ כדי להיכנס במצב פיתוח' 
            : 'לחץ כדי להיכנס עם חשבון Google'
          }
        </Typography>
        
        <Typography variant="caption" color="text.secondary" align="center">
          Auth Mode: {AuthProvider.getAuthMode()}
        </Typography>
      </Box>
    </Container>
  );
};

export default SimpleLogin;

export default SimpleLogin;
