/* cspell:disable */
import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Button, Box, Alert } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { AuthService } from '../services/AuthService';
import { SecurityUtils } from '../utils/SecurityUtils';

const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewDevice, setIsNewDevice] = useState(false);

  useEffect(() => {
    // בדיקת אבטחה ומכשיר חדש
    const checkSecurity = async () => {
      const newDevice = SecurityUtils.isNewDevice();
      setIsNewDevice(newDevice);
      
      if (newDevice) {
        SecurityUtils.logSecurityEvent('new_device_detected');
        console.log('🚨 התזוהה מכשיר חדש');
      }
      
      // בדיקת HTTPS
      if (!SecurityUtils.isSecureConnection()) {
        SecurityUtils.logSecurityEvent('insecure_connection');
        setError('חיבור לא מאובטח. אנא השתמש ב-HTTPS.');
        return;
      }
      
      // שליחת מידע אבטחה לשרת
      await SecurityUtils.sendSecurityInfo();
    };
    
    checkSecurity();
    
    // בדוק אם יש קוד מGoogle OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      console.log('🔑 OAuth callback received'); // Removed sensitive code from logs
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    console.log('🔄 Processing OAuth callback...');
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:4000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בתקשורת עם השרת. אנא נסה שוב מאוחר יותר.');
      }
      
      const data = await response.json();
      console.log('✅ Authentication successful'); // Removed sensitive token data from logs
      
      // שימוש בsessionStorage במקום localStorage לטובת אבטחה מתקדמת
      sessionStorage.setItem('taskflow-user', JSON.stringify(data.user));
      sessionStorage.setItem('taskflow-session', JSON.stringify({
        sessionId: data.sessionInfo?.sessionId,
        timestamp: data.timestamp,
        sessionInfo: data.sessionInfo,
        expiresAt: data.sessionInfo?.expiresAt || Date.now() + (data.security?.expiresIn || 3600) * 1000
      }));
      
      // שמירת Access Token ו-Refresh Token באופן מאובטח
      if (data.accessToken) {
        sessionStorage.setItem('taskflow-access-token', data.accessToken);
      }
      if (data.refreshToken) {
        sessionStorage.setItem('taskflow-refresh-token', data.refreshToken);
      }
      
      // אם יש המלצה על אוטו-לוגאוט, הגדר טיימר
      if (data.security?.autoLogout) {
        const autoLogoutTime = data.security.autoLogout * 1000;
        setTimeout(() => {
          console.log('🔒 Auto-logout triggered for security');
          sessionStorage.clear();
          window.location.reload();
        }, autoLogoutTime);
      }
      
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.reload();
      
    } catch (error: any) {
      console.error('❌ Token exchange failed:', error);
      const userFriendlyMessage = error.message.includes('Failed to fetch') 
        ? 'בעיה בחיבור לשרת. בדוק את החיבור לאינטרנט ונסה שוב.'
        : error.message || 'התחברות נכשלה. אנא נסה שוב.';
      setError(userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    // רישום ניסיון התחברות
    SecurityUtils.logSecurityEvent('login_attempt', { method: 'google' });
    
    try {
      // רישום מכשיר אם חדש
      if (isNewDevice) {
        SecurityUtils.registerDevice();
      }
      
      await AuthService.signInWithGoogle();
      SecurityUtils.logSecurityEvent('login_success', { method: 'google' });
    } catch (error: any) {
      console.error('❌ Google login failed:', error);
      SecurityUtils.logSecurityEvent('login_failed', { 
        method: 'google', 
        error: error?.message || 'Unknown error' 
      });
      
      const userFriendlyMessage = error.message.includes('popup') 
        ? 'החלון הקופץ נחסם. אנא אפשר חלונות קופצים ונסה שוב.'
        : error.message.includes('cancelled') || error.message.includes('closed')
        ? 'ההתחברות בוטלה. אנא נסה שוב.'
        : 'שגיאה בהתחברות עם Google. אנא נסה שוב.';
      setError(userFriendlyMessage);
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
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          העוזר האישי החכם שלך
        </Typography>
        
        <Typography variant="body2" color="primary.main" sx={{ mb: 3, fontWeight: 500 }}>
          🔐 התחברות מאובטחת עם חשבון Google שלך
        </Typography>

        {isNewDevice && (
          <Alert severity="info" sx={{ mb: 2 }}>
            🆕 זוהה מכשיר חדש או ברוזר חדש
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              המערכת תרשום מכשיר זה לטובת אבטחה מתקדמת.
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              💡 טיפ: ודא שאתה מאפשר חלונות קופצים ושחשבון Google שלך פעיל.
            </Typography>
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{ py: 2, px: 4, fontSize: '1.1rem', mb: 2 }}
          aria-label="התחבר באמצעות חשבון Google"
        >
          {loading ? 'מתחבר...' : 'התחבר עם Google'}
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
          ההתחברות מתבצעת באמצעות Google OAuth 2.0 באופן מאובטח. 
          איננו שומרים את סיסמת Google שלך.
        </Typography>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
            💡 למה Google OAuth?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • אבטחה מרבית - לא נשמרות סיסמאות במערכת
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • נוחות - התחברות מהירה ללא הרשמה
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • אמינות - מערכת אימות מוכחת של Google
          </Typography>
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200' }}>
          <Typography variant="body2" color="primary.main" sx={{ mb: 1, fontWeight: 500 }}>
            🛡️ אבטחה מתקדמת
          </Typography>
          <Typography variant="caption" color="primary.dark" sx={{ display: 'block', mb: 0.5 }}>
            • הגנה מפני ניסיונות פריצה (Rate Limiting)
          </Typography>
          <Typography variant="caption" color="primary.dark" sx={{ display: 'block', mb: 0.5 }}>
            • ניטור התחברויות חשודות ומכשירים חדשים
          </Typography>
          <Typography variant="caption" color="primary.dark" sx={{ display: 'block' }}>
            • אוטו-לוגאוט לאחר פרק זמן לאבטחה מירבית
          </Typography>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
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
      </Paper>
    </Container>
  );
};

export default LoginScreen;
