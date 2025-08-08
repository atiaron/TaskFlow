const express = require('express');
const fetch = require('node-fetch');
// const rateLimit = require('express-rate-limit');
// const slowDown = require('express-slow-down');
const JWTService = require('../services/JWTService');
const DatabaseLogger = require('../services/DatabaseLogger');
const { authenticateToken, requireAdmin, trackUserActivity, checkConcurrentSessions } = require('../middleware/auth');

// NEW: Firebase Admin for Auth Bridge
const admin = require('../firebaseAdmin');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Rate limiting and slow down moved to global mounting in server.js for specific endpoints

// Middleware לניטור ולוגים מתקדמים
const authLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`🔐 Auth attempt - IP: ${ip}, Time: ${timestamp}, UA: ${userAgent.substring(0, 100)}`);
  
  // שמירת מידע בקשה לטובת ניתוח אבטחה
  req.authAttempt = {
    ip,
    timestamp,
    userAgent,
    endpoint: req.path
  };
  
  next();
};

// Apply security middleware to all auth routes
router.use(authLogger);
// Note: rate limiters are mounted per-route in server.js

// Google OAuth endpoint - מאובטח עם Rate Limiting ו-JWT מלא
router.post('/google', async (req, res) => {
  const startTime = Date.now();
  const { ip, userAgent } = req.authAttempt;
  let authLogData = {
    success: false,
    ip,
    userAgent,
    method: 'google',
    responseTime: 0
  };
  
  try {
    const { code, deviceFingerprint } = req.body;
    const redirectUri = 'http://localhost:3000'; // Fixed redirect URI
    
    // Input validation - בדיקת תקינות הקלט
    if (!code || typeof code !== 'string' || code.length < 10) {
      console.log(`❌ Invalid auth code from IP: ${ip}`);
      authLogData.errorMessage = 'Invalid auth code';
      authLogData.responseTime = Date.now() - startTime;
      await DatabaseLogger.logAuthAttempt(authLogData);
      
      return res.status(400).json({ 
        error: 'קוד האימות לא תקין',
        timestamp: new Date().toISOString()
      });
    }

    // Security check - בדיקה שהקוד לא מכיל תווים חשודים
    if (!/^[a-zA-Z0-9/-_=+.]+$/.test(code)) {
      console.log(`❌ Suspicious auth code format from IP: ${ip}`);
      authLogData.errorMessage = 'Suspicious code format';
      authLogData.suspicious = true;
      authLogData.responseTime = Date.now() - startTime;
      await DatabaseLogger.logAuthAttempt(authLogData);
      
      return res.status(400).json({ 
        error: 'פורמט קוד האימות לא חוקי',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔄 Processing OAuth for IP: ${ip}...`);

    // Exchange authorization code for access token with timeout
    const tokenResponse = await Promise.race([
      fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'TaskFlow-Server/2.0.0'
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Token exchange timeout')), 10000)
      )
    ]);

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error(`❌ Token exchange failed for IP ${ip}:`, error.substring(0, 200));
      
      authLogData.errorMessage = 'Google token exchange failed';
      authLogData.responseTime = Date.now() - startTime;
      await DatabaseLogger.logAuthAttempt(authLogData);
      
      // לא לחשוף פרטי השגיאה המדויקים למשתמש
      return res.status(400).json({ 
        error: 'כשל באימות עם Google. אנא נסה שוב.',
        timestamp: new Date().toISOString()
      });
    }

    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token) {
      console.log(`❌ No access token received for IP: ${ip}`);
      authLogData.errorMessage = 'No access token from Google';
      authLogData.responseTime = Date.now() - startTime;
      await DatabaseLogger.logAuthAttempt(authLogData);
      
      return res.status(400).json({ 
        error: 'לא התקבל אסימון גישה מ-Google',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ Access token received for IP: ${ip}, fetching user info...`);

    // Get user info with the access token with timeout
    const userInfoResponse = await Promise.race([
      fetch(
        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokens.access_token}`,
        {
          headers: {
            'User-Agent': 'TaskFlow-Server/2.0.0'
          }
        }
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User info fetch timeout')), 8000)
      )
    ]);
    
    if (!userInfoResponse.ok) {
      console.log(`❌ Failed to get user info for IP: ${ip}`);
      authLogData.errorMessage = 'Failed to get user info from Google';
      authLogData.responseTime = Date.now() - startTime;
      await DatabaseLogger.logAuthAttempt(authLogData);
      
      return res.status(400).json({ 
        error: 'כשל בקבלת פרטי המשתמש מ-Google',
        timestamp: new Date().toISOString()
      });
    }
    
    const userInfo = await userInfoResponse.json();
    
    // Validate user info
    if (!userInfo.email || !userInfo.id) {
      console.log(`❌ Invalid user info received for IP: ${ip}`);
      authLogData.errorMessage = 'Invalid user info from Google';
      authLogData.responseTime = Date.now() - startTime;
      await DatabaseLogger.logAuthAttempt(authLogData);
      
      return res.status(400).json({ 
        error: 'פרטי המשתמש לא תקינים',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`👤 User authenticated successfully: ${userInfo.email} from IP: ${ip}`);
    
    const user = {
      id: userInfo.id,
      name: userInfo.name || userInfo.email.split('@')[0],
      email: userInfo.email,
      picture: userInfo.picture,
      settings: {
        theme: 'light',
        language: 'he',
        notifications: true
      },
      // מידע אבטחה לניטור
      lastLogin: new Date().toISOString(),
      loginIP: ip,
      loginUserAgent: userAgent.substring(0, 200)
    };

    // יצירת JWT Token מותאם אישית עם כל הפרטים
    const sessionInfo = {
      ip,
      userAgent,
      fingerprint: deviceFingerprint
    };
    
    const jwtData = JWTService.generateAccessToken(user, sessionInfo);
    const refreshToken = JWTService.generateRefreshToken(user.id, jwtData.sessionId);

    // עדכון נתוני הלוג עם הצלחה
    authLogData.success = true;
    authLogData.userId = user.id;
    authLogData.email = user.email;
    authLogData.sessionId = jwtData.sessionId;
    authLogData.deviceFingerprint = deviceFingerprint;
    authLogData.responseTime = Date.now() - startTime;

    // רישום בלוגים
    await Promise.all([
      DatabaseLogger.logAuthAttempt(authLogData),
      DatabaseLogger.logDeviceInfo({
        userId: user.id,
        deviceFingerprint,
        ip,
        userAgent,
        isNewDevice: !deviceFingerprint // אם אין fingerprint, זה מכשיר חדש
      }),
      DatabaseLogger.logActiveSession({
        sessionId: jwtData.sessionId,
        userId: user.id,
        email: user.email,
        ip,
        userAgent,
        deviceFingerprint,
        expiresAt: new Date(jwtData.expiresAt).toISOString()
      })
    ]);

    // Log successful authentication
    const duration = Date.now() - startTime;
    console.log(`✅ Authentication completed in ${duration}ms for ${userInfo.email} from ${ip}`);

    res.json({
      user: user,
      accessToken: jwtData.token,
      refreshToken: refreshToken,
      timestamp: new Date().toISOString(),
      sessionInfo: {
        sessionId: jwtData.sessionId,
        ip: ip,
        userAgent: userAgent.substring(0, 100),
        timestamp: new Date().toISOString(),
        expiresAt: new Date(jwtData.expiresAt).toISOString()
      },
      security: {
        tokenType: 'Bearer',
        expiresIn: jwtData.expiresIn,
        scope: 'full-access',
        algorithm: 'HS256',
        // הוראות אבטחה לקליינט
        storageRecommendation: 'sessionStorage', // לא localStorage לטובת אבטחה
        autoLogout: jwtData.expiresIn // אוטו-לוגאוט אחרי תוקף ה-JWT
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ OAuth authentication error after ${duration}ms for IP ${ip}:`, error.message);
    
    // עדכון לוג עם שגיאה
    authLogData.errorMessage = error.message;
    authLogData.responseTime = duration;
    await DatabaseLogger.logAuthAttempt(authLogData);
    
    // Log security incident
    console.log(`🚨 Security log - Failed auth attempt: IP=${ip}, Error=${error.message}, Duration=${duration}ms`);
    
    res.status(500).json({ 
      error: 'שגיאה פנימית במערכת האימות. אנא נסה שוב.',
    });
  }
});

// JWT Token verification endpoint
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        error: 'Token is required',
        valid: false 
      });
    }

    const verification = JWTService.verifyAccessToken(token);
    
    if (!verification.valid) {
      const statusCode = verification.expired ? 401 : 403;
      return res.status(statusCode).json({
        valid: false,
        expired: verification.expired,
        error: verification.error
      });
    }

    res.json({
      valid: true,
      decoded: verification.decoded,
      expired: false
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(500).json({ 
      error: 'Token verification failed',
      valid: false 
    });
  }
});

// Token refresh endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const { ip, userAgent } = req.authAttempt;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const newTokenData = JWTService.refreshAccessToken(refreshToken, { ip, userAgent });
    
    console.log(`🔄 Token refreshed for session ${newTokenData.sessionId}`);
    
    res.json({
      accessToken: newTokenData.token,
      expiresAt: new Date(newTokenData.expiresAt).toISOString(),
      expiresIn: newTokenData.expiresIn,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(401).json({ 
      error: 'Invalid or expired refresh token',
      message: error.message 
    });
  }
});

// Admin Dashboard - Auth Logs (protected route)
router.get('/admin/auth-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      fromDate, 
      toDate, 
      success, 
      userId, 
      ip, 
      limit = 100 
    } = req.query;

    const filters = {};
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;
    if (success !== undefined) filters.success = success === 'true';
    if (userId) filters.userId = userId;
    if (ip) filters.ip = ip;

    const logs = await DatabaseLogger.getAuthLogs(filters);
    const limitedLogs = logs.slice(0, parseInt(limit));

    res.json({
      logs: limitedLogs,
      total: logs.length,
      filtered: limitedLogs.length,
      filters: filters,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get auth logs:', error);
    res.status(500).json({ error: 'Failed to retrieve auth logs' });
  }
});

// Admin Dashboard - Active Sessions (protected route)
router.get('/admin/active-sessions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.query;
    
    const sessions = await DatabaseLogger.getActiveSessions(userId || null);
    
    res.json({
      sessions,
      count: sessions.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get active sessions:', error);
    res.status(500).json({ error: 'Failed to retrieve active sessions' });
  }
});

// Admin Dashboard - Security Statistics (protected route)
router.get('/admin/security-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { timeFrame = 24 } = req.query; // default 24 hours
    
    const stats = await DatabaseLogger.getSecurityStats(parseInt(timeFrame));
    
    res.json({
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get security stats:', error);
    res.status(500).json({ error: 'Failed to retrieve security statistics' });
  }
});

// User's own sessions management (protected route)
router.get('/my-sessions', authenticateToken, trackUserActivity, checkConcurrentSessions, async (req, res) => {
  try {
    // משיכת userId מ-JWT במקום query parameter
    const userId = req.user.userId;
    
    const sessions = await DatabaseLogger.getActiveSessions(userId);
    
    // הסתרת מידע רגיש למשתמש רגיל
    const sanitizedSessions = sessions.map(session => ({
      sessionId: session.sessionId,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
      ip: session.ip.replace(/\.\d+$/, '.***'), // הסתרת חלק מה-IP
      userAgent: session.userAgent.substring(0, 50) + '...',
      active: session.active,
      current: session.sessionId === req.sessionId // השוואה עם הסשן הנוכחי
    }));
    
    res.json({
      sessions: sanitizedSessions,
      count: sanitizedSessions.length,
      currentSessionId: req.sessionId,
      totalActiveSessions: req.sessionCount || sanitizedSessions.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get user sessions:', error);
    res.status(500).json({ error: 'Failed to retrieve your sessions' });
  }
});

// Security status endpoint - בדיקת סטטוס אבטחה
router.get('/security-status', (req, res) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  
  res.json({
    timestamp,
    ip,
    security: {
      httpsOnly: req.secure || req.headers['x-forwarded-proto'] === 'https',
      rateLimiting: true,
      bruteForceProtection: true,
      tokenSecurity: 'OAuth2.0',
      sessionManagement: true,
      loggingEnabled: true
    },
    recommendations: {
      useSessionStorage: true,
      enableAutoLogout: true,
      regularTokenRefresh: true,
      monitorSessions: true
    },
    authMethods: [
      {
        type: 'Google OAuth 2.0',
        enabled: true,
        secure: true,
        rateLimited: true
      }
    ]
  });
});

// Device/Browser detection endpoint
router.post('/device-info', authLogger, (req, res) => {
  const { userAgent, ip } = req.authAttempt;
  const { deviceFingerprint } = req.body;
  
  // ניתוח מידע המכשיר לטובת זיהוי מכשירים חדשים
  const deviceInfo = {
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
    fingerprint: deviceFingerprint || 'unknown',
    // בעתיד: זיהוי VPN/Proxy, גיאולוקיישן
    suspicious: false, // יתעדכן על פי אלגוריתמים
    newDevice: true // בעתיד: השוואה עם DB
  };
  
  console.log(`🔍 Device info collected for IP: ${ip}`);
  
  res.json({
    message: 'מידע המכשיר נרשם בהצלחה',
    deviceInfo: {
      timestamp: deviceInfo.timestamp,
      newDevice: deviceInfo.newDevice,
      suspicious: deviceInfo.suspicious
    }
  });
});

// ===== NEW: AUTH BRIDGE ENDPOINTS =====

const ACCESS_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Auth Bridge - מחליף Firebase ID Token ב-JWT
 * POST /api/auth/exchange
 */
router.post('/exchange', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ 
        error: 'idToken required',
        message: 'Firebase ID Token is required for JWT exchange'
      });
    }

    console.log('🔄 Auth Exchange: Verifying Firebase ID Token...');
    
    // 🔧 Dev bypass for MockAuth
    if (process.env.NODE_ENV === 'development' && idToken === 'mock-id-token') {
      console.log('🔧 Dev bypass: Using MockAuth token');
      const payload = {
        userId: 'dev-user',
        email: 'dev@taskflow.com',
        name: 'Dev Developer',
        scope: 'full-access',
        provider: 'mock'
      };

      // יצירת Access Token
      const accessToken = jwt.sign(
        { ...payload, typ: 'access' },
        process.env.JWT_SECRET || 'taskflow-super-secret-key-2025',
        { expiresIn: '1h', issuer: 'TaskFlow-Server', audience: 'TaskFlow-Client' }
      );
      
      // יצירת Refresh Token
      const refreshToken = jwt.sign(
        { ...payload, typ: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'taskflow-refresh-secret-2025',
        { expiresIn: '30d', issuer: 'TaskFlow-Server', audience: 'TaskFlow-Client' }
      );

      console.log('✅ Dev bypass: JWT tokens generated successfully');

      return res.json({ 
        accessToken,
        refreshToken,
        expiresInMs: ACCESS_TTL_MS,
        user: payload
      });
    }
    
    // ✅ רגיל: אימות מול Firebase/Emulator
    const decoded = await admin.auth().verifyIdToken(idToken);
    
    console.log(`✅ Auth Exchange: Token verified for user ${decoded.email}`);
    
    const payload = {
      userId: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || decoded.email?.split('@')[0] || 'User',
      scope: 'full-access',
      provider: 'firebase'
    };

    // יצירת Access Token
    const accessToken = jwt.sign(
      { ...payload, typ: 'access' },
      process.env.JWT_SECRET || 'taskflow-super-secret-key-2025',
      { expiresIn: '1h', issuer: 'TaskFlow-Server', audience: 'TaskFlow-Client' }
    );
    
    // יצירת Refresh Token
    const refreshToken = jwt.sign(
      { ...payload, typ: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'taskflow-refresh-secret-2025',
      { expiresIn: '30d', issuer: 'TaskFlow-Server', audience: 'TaskFlow-Client' }
    );

    console.log('✅ Auth Exchange: JWT tokens generated successfully');

    return res.json({ 
      accessToken,
      refreshToken,
      expiresInMs: ACCESS_TTL_MS,
      user: payload
    });
    
  } catch (error) {
    console.error('❌ Auth Exchange failed:', error.message);
    
    return res.status(401).json({ 
      error: 'invalid idToken',
      message: 'Failed to verify Firebase ID Token',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Refresh JWT Access Token (Auth Bridge version)
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'refreshToken required' 
      });
    }

    console.log('🔄 Auth Refresh: Verifying refresh token...');
    
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || 'taskflow-refresh-secret-2025'
    );
    
    if (decoded.typ !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    // יצירת Access Token חדש
    const newAccessToken = jwt.sign(
      { 
        userId: decoded.userId, 
        email: decoded.email || null,
        name: decoded.name || 'User',
        scope: 'full-access',
        provider: decoded.provider || 'firebase',
        typ: 'access' 
      },
      process.env.JWT_SECRET || 'taskflow-super-secret-key-2025',
      { expiresIn: '1h', issuer: 'TaskFlow-Server', audience: 'TaskFlow-Client' }
    );
    
    console.log('✅ Auth Refresh: New access token generated');
    
    return res.json({ 
      accessToken: newAccessToken,
      expiresInMs: ACCESS_TTL_MS 
    });
    
  } catch (error) {
    console.error('❌ Auth Refresh failed:', error.message);
    
    return res.status(401).json({ 
      error: 'invalid refresh token',
      message: 'Refresh token is invalid or expired' 
    });
  }
});

/**
 * Middleware להגנה על API endpoints (Auth Bridge version)
 */
function requireAuthBridge(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ 
      error: 'authorization required',
      message: 'Bearer token missing' 
    });
  }
  
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'taskflow-super-secret-key-2025'
    );
    
    if (decoded.typ !== 'access') {
      throw new Error('Invalid token type');
    }
    
    req.user = decoded;
    return next();
    
  } catch (error) {
    return res.status(401).json({ 
      error: 'invalid token',
      message: 'Access token is invalid or expired' 
    });
  }
}

// Export middleware יחד עם router
router.requireAuthBridge = requireAuthBridge;

module.exports = router;
