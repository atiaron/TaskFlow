const JWTService = require('../services/JWTService');
const DatabaseLogger = require('../services/DatabaseLogger');

// Middleware לבדיקת JWT Token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access token is required',
        code: 'NO_TOKEN'
      });
    }

    const verification = JWTService.verifyAccessToken(token);
    
    if (!verification.valid) {
      const statusCode = verification.expired ? 401 : 403;
      const code = verification.expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
      
      return res.status(statusCode).json({
        error: verification.expired ? 'Token expired' : 'Invalid token',
        code: code,
        expired: verification.expired
      });
    }

    // הוספת פרטי המשתמש ל-request
    req.user = verification.decoded;
    req.sessionId = verification.decoded.sessionId;
    
    // עדכון זמן פעילות אחרון
    // כאן אפשר להוסיף עדכון ל-DB של last activity
    
    next();
    
  } catch (error) {
    console.error('❌ JWT authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware לבדיקת הרשאות מנהל
const requireAdmin = (req, res, next) => {
  // בעתיד: בדיקה אם המשתמש הוא מנהל
  // כרגע נניח שכל משתמש מאומת יכול לגשת לדשבורד
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required for admin access',
      code: 'NO_AUTH'
    });
  }
  
  // כאן אפשר להוסיף בדיקת תפקיד:
  // if (req.user.role !== 'admin') {
  //   return res.status(403).json({ error: 'Admin access required' });
  // }
  
  next();
};

// Middleware לניטור פעילות משתמש
const trackUserActivity = async (req, res, next) => {
  if (req.user) {
    // רישום פעילות המשתמש
    const activityData = {
      userId: req.user.userId,
      sessionId: req.user.sessionId,
      endpoint: req.path,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')?.substring(0, 200),
      timestamp: new Date().toISOString()
    };
    
    // ברקע - לא לעכב את הבקשה
    setImmediate(async () => {
      try {
        // כאן אפשר להוסיף רישום פעילות ל-DatabaseLogger
        console.log(`📊 User activity: ${activityData.userId} accessed ${activityData.method} ${activityData.endpoint}`);
      } catch (error) {
        console.error('❌ Failed to track user activity:', error);
      }
    });
  }
  
  next();
};

// Middleware לבדיקת concurrent sessions
const checkConcurrentSessions = async (req, res, next) => {
  if (req.user) {
    try {
      const activeSessions = await DatabaseLogger.getActiveSessions(req.user.userId);
      
      // אם יש יותר מ-5 סשנים פעילים - חשוד
      if (activeSessions.length > 5) {
        console.log(`🚨 Suspicious activity: User ${req.user.userId} has ${activeSessions.length} active sessions`);
        
        // כאן אפשר להוסיף לוגיקה נוספת:
        // - שליחת התראה למשתמש
        // - חסימה זמנית
        // - דרישה לאימות נוסף
      }
      
      // הוספת מידע על מספר סשנים ל-request
      req.sessionCount = activeSessions.length;
      
    } catch (error) {
      console.error('❌ Failed to check concurrent sessions:', error);
    }
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  trackUserActivity,
  checkConcurrentSessions
};
