const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'taskflow-super-secret-key-2025';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'taskflow-refresh-secret-2025';
    this.issuer = 'TaskFlow-Server';
    this.audience = 'TaskFlow-Client';
  }

  // יצירת Access Token עם פרטים מלאים
  generateAccessToken(user, sessionInfo = {}) {
    const now = Date.now();
    const sessionId = uuidv4();
    
    const payload = {
      // פרטי משתמש
      userId: user.id,
      email: user.email,
      name: user.name,
      
      // פרטי סשן
      sessionId,
      scope: 'full-access',
      
      // פרטי אבטחה
      iat: Math.floor(now / 1000), // issued at
      exp: Math.floor((now + 3600000) / 1000), // expires in 1 hour
      iss: this.issuer,
      aud: this.audience,
      
      // מידע מכשיר
      deviceInfo: {
        ip: sessionInfo.ip || 'unknown',
        userAgent: sessionInfo.userAgent?.substring(0, 200) || 'unknown',
        fingerprint: sessionInfo.fingerprint || 'unknown'
      },
      
      // מידע נוסף
      loginTime: now,
      tokenType: 'access'
    };

    const token = jwt.sign(payload, this.secret, {
      algorithm: 'HS256'
    });

    return {
      token,
      sessionId,
      expiresAt: payload.exp * 1000,
      expiresIn: 3600 // seconds
    };
  }

  // יצירת Refresh Token (תוקף ארוך יותר)
  generateRefreshToken(userId, sessionId) {
    const now = Date.now();
    
    const payload = {
      userId,
      sessionId,
      tokenType: 'refresh',
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + 604800000) / 1000), // 7 days
      iss: this.issuer,
      aud: this.audience
    };

    return jwt.sign(payload, this.refreshSecret, {
      algorithm: 'HS256'
    });
  }

  // אימות Access Token
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience
      });
      
      // בדיקת תוקף
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp <= now) {
        throw new Error('Token expired');
      }
      
      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      return {
        valid: false,
        decoded: null,
        expired: error.message.includes('expired'),
        error: error.message
      };
    }
  }

  // אימות Refresh Token
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshSecret, {
        issuer: this.issuer,
        audience: this.audience
      });
      
      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      return {
        valid: false,
        decoded: null,
        expired: error.message.includes('expired'),
        error: error.message
      };
    }
  }

  // חידוש Token
  refreshAccessToken(refreshToken, newSessionInfo = {}) {
    const verification = this.verifyRefreshToken(refreshToken);
    
    if (!verification.valid) {
      throw new Error('Invalid refresh token');
    }

    const { userId, sessionId } = verification.decoded;
    
    // יצירת Access Token חדש עם אותו Session ID
    const user = { id: userId }; // יש לקבל מה-DB בפועל
    return this.generateAccessToken(user, { ...newSessionInfo, sessionId });
  }

  // פענוח Token ללא אימות (לצורכי debug)
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      return null;
    }
  }
}

module.exports = new JWTService();
