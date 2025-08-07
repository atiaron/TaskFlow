import React from 'react';
import { Button, Box, Typography, Card, CardContent, Alert } from '@mui/material';

interface DevModeLoginProps {
  onLogin: (user: any) => void;
}

export const DevModeLogin: React.FC<DevModeLoginProps> = ({ onLogin }) => {
  
  const handleDemoLogin = async () => {
    try {
      console.log('🔧 Development mode - creating demo user');
      
      // Create a mock user for development
      const demoUser = {
        id: 'demo-user-123',
        uid: 'demo-user-123',
        email: 'demo@taskflow.dev',
        displayName: 'משתמש דמו',
        photoURL: 'https://via.placeholder.com/150',
        isAnonymous: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        }
      };
      
      // Store in session for demo purposes
      sessionStorage.setItem('taskflow-demo-user', JSON.stringify(demoUser));
      sessionStorage.setItem('taskflow-access-token', 'demo-token-' + Date.now());
      sessionStorage.setItem('taskflow-refresh-token', 'demo-refresh-' + Date.now());
      
      const sessionData = {
        userId: demoUser.id,
        email: demoUser.email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
      sessionStorage.setItem('taskflow-session', JSON.stringify(sessionData));
      
      console.log('✅ Demo user created and logged in');
      onLogin(demoUser);
      
    } catch (error) {
      console.error('❌ Demo login failed:', error);
    }
  };

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="100vh"
      p={3}
      sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <Card sx={{ maxWidth: 500, width: '100%', mb: 2 }}>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight="bold">
            TaskFlow
          </Typography>
          <Typography variant="h6" component="h2" gutterBottom color="textSecondary">
            מצב פיתוח - Development Mode
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3, textAlign: 'right' }}>
            זהו מצב פיתוח המאפשר גישה למערכת ללא אימות Google. 
            הנתונים נשמרים זמנית ברוזר בלבד.
          </Alert>
          
          <Button
            variant="contained"
            size="large"
            onClick={handleDemoLogin}
            sx={{ 
              mt: 2, 
              py: 1.5, 
              px: 4,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem'
            }}
          >
            🚀 כניסה למצב דמו
          </Button>
          
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            • ✅ גישה מלאה לכל הפיצ'רים
            <br />
            • 🔄 סנכרון מקומי 
            <br />
            • 🤖 AI צ'אט פעיל
            <br />
            • 📋 ניהול משימות
          </Typography>
        </CardContent>
      </Card>
      
      <Typography variant="caption" color="rgba(255,255,255,0.7)">
        Running in emulator mode. Do not use with production credentials.
      </Typography>
    </Box>
  );
};
