/* cspell:disable */
import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Button, Box, Alert } from '@mui/material';
import { Google as GoogleIcon, DeveloperMode as DevIcon } from '@mui/icons-material';
import { AuthService } from '../services';
import { SecurityUtils } from '../utils/SecurityUtils';

const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewDevice, setIsNewDevice] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    // 🚦 זיהוי סביבה
    const detectEnvironment = () => {
      const isDev = process.env.NODE_ENV === 'development' || 
                   process.env.REACT_APP_IS_DEV_MODE === 'true' ||
                   window.location.hostname === 'localhost';
      
      setIsDevelopment(isDev);
      
      console.log('🚦 LoginScreen Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        IS_DEV_MODE: process.env.REACT_APP_IS_DEV_MODE,
        SKIP_OAUTH: process.env.REACT_APP_SKIP_OAUTH,
        USE_MOCK_CLAUDE: process.env.REACT_APP_USE_MOCK_CLAUDE,
        CSP_ENABLED: process.env.REACT_APP_CSP_ENABLED,
        hostname: window.location.hostname,
        isDev
      });
    };
    
    detectEnvironment();
    // 🛡️ בדיקת אבטחה ומכשיר חדש (רק בפרודקשן)
    const checkSecurity = async () => {
      if (!isDevelopment) {
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
      } else {
        console.log('🔓 Development mode - security checks skipped');
      }
    };
    
    checkSecurity();
    
    // בדוק אם יש קוד מGoogle OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      console.log('🔑 OAuth callback received'); // Removed sensitive code from logs
      handleOAuthCallback(code);
    }
  }, [isDevelopment]);

  const handleOAuthCallback = async (code: string) => {
    console.log('🔄 Processing OAuth callback...');
    setLoading(true);
    setError(null);
    
    try {
      // Skip custom server in development, use Firebase emulator directly
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        console.log('🔄 Development mode - using Firebase emulator directly');
        // Just proceed to main app without custom server
        window.location.href = '/app';
        return;
      }
      
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:4000' 
        : (process.env.REACT_APP_API_URL || 'https://taskflow-backend.vercel.app');
      
      const response = await fetch(`${apiUrl}/api/auth/google`, {
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
    
    try {
      console.log('🔑 Starting login process...', {
        isDevelopment,
        skipOAuth: process.env.REACT_APP_SKIP_OAUTH,
        service: isDevelopment ? 'MockAuth' : 'RealAuth'
      });
      
      // רישום ניסיון התחברות (רק בפרודקשן)
      if (!isDevelopment) {
        SecurityUtils.logSecurityEvent('login_attempt', { method: 'google' });
        
        // רישום מכשיר אם חדש
        if (isNewDevice) {
          SecurityUtils.registerDevice();
        }
      }
      
      // ✨ שימוש בservice injection - AuthService יהיה Mock בdev, Real בprod
      const loginResult = await AuthService.login();
      console.log('✅ Login successful:', loginResult);
      
      // רישום הצלחה (רק בפרודקשן)
      if (!isDevelopment) {
        SecurityUtils.logSecurityEvent('login_success', { method: 'google' });
      }
      
      // ניתוב לאפליקציה
      window.location.href = '/app';
      
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      if (!isDevelopment) {
        SecurityUtils.logSecurityEvent('login_failed', { 
          method: 'google', 
          error: error?.message || 'Unknown error' 
        });
      }
      
      const userFriendlyMessage = isDevelopment 
        ? 'התחברות נכשלה במצב פיתוח. בדוק את הקונסול.'
        : error.message.includes('popup') 
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

        {/* Environment Indicator */}
        {isDevelopment && (
          <Alert severity="info" icon={<DevIcon />} sx={{ mb: 2 }}>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                🚀 מצב פיתוח פעיל
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                • אימות דמיתי (MockAuth) • CSP מבוטל • Debug מלא
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                NODE_ENV: {process.env.NODE_ENV} | Dev Mode: {process.env.REACT_APP_IS_DEV_MODE}
              </Typography>
            </Box>
          </Alert>
        )}

        {isNewDevice && !isDevelopment && (
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
          startIcon={isDevelopment ? <DevIcon /> : <GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{ 
            py: 2, 
            px: 4, 
            fontSize: '1.1rem', 
            mb: 2,
            bgcolor: isDevelopment ? 'orange.main' : 'primary.main',
            '&:hover': {
              bgcolor: isDevelopment ? 'orange.dark' : 'primary.dark'
            }
          }}
          aria-label={isDevelopment ? "התחבר במצב פיתוח" : "התחבר באמצעות חשבון Google"}
        >
          {loading 
            ? 'מתחבר...' 
            : isDevelopment 
            ? 'התחבר במצב פיתוח (Mock)' 
            : 'התחבר עם Google'
          }
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
          {isDevelopment ? (
            <>🔧 מצב פיתוח: התחברות דמיתית עם משתמש דמו. לא נדרש חשבון Google.</>
          ) : (
            <>ההתחברות מתבצעת באמצעות Google OAuth 2.0 באופן מאובטח. איננו שומרים את סיסמת Google שלך.</>
          )}
        </Typography>

        <Box sx={{ mt: 3, p: 2, bgcolor: isDevelopment ? 'orange.50' : 'grey.50', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
            {isDevelopment ? '� מצב פיתוח' : '�💡 למה Google OAuth?'}
          </Typography>
          {isDevelopment ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • שירותי Mock: אין צורך באימות אמיתי
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • Debug מלא: כל הלוגים מוצגים בקונסול
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • פיתוח מהיר: hot reload ו-live updates
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • אבטחה מרבית - לא נשמרות סיסמאות במערכת
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • נוחות - התחברות מהירה ללא הרשמה
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • מהימנות - סטנדרט תעשייתי מוכח
              </Typography>
            </>
          )}
        </Box>

        {!isDevelopment && (
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
        )}

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
