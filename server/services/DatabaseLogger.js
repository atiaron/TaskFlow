const fs = require('fs').promises;
const path = require('path');

class DatabaseLogger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.authLogFile = path.join(this.logsDir, 'auth-attempts.json');
    this.sessionLogFile = path.join(this.logsDir, 'active-sessions.json');
    this.deviceLogFile = path.join(this.logsDir, 'device-info.json');
    
    this.initializeLogFiles();
  }

  async initializeLogFiles() {
    try {
      // יצירת תיקיית לוגים אם לא קיימת
      await fs.mkdir(this.logsDir, { recursive: true });
      
      // יצירת קבצי לוג אם לא קיימים
      const files = [this.authLogFile, this.sessionLogFile, this.deviceLogFile];
      
      for (const file of files) {
        try {
          await fs.access(file);
        } catch {
          await fs.writeFile(file, JSON.stringify([], null, 2));
        }
      }
      
      console.log('✅ Database logger initialized');
    } catch (error) {
      console.error('❌ Failed to initialize database logger:', error);
    }
  }

  // רישום ניסיון התחברות
  async logAuthAttempt(data) {
    const logEntry = {
      id: require('uuid').v4(),
      timestamp: new Date().toISOString(),
      success: data.success,
      userId: data.userId || null,
      email: data.email || null,
      ip: data.ip,
      userAgent: data.userAgent?.substring(0, 500) || 'unknown',
      method: data.method || 'google',
      sessionId: data.sessionId || null,
      deviceFingerprint: data.deviceFingerprint || null,
      errorMessage: data.errorMessage || null,
      responseTime: data.responseTime || null,
      location: data.location || null, // יתווסף בעתיד
      suspicious: data.suspicious || false
    };

    try {
      const logs = await this.readLogFile(this.authLogFile);
      logs.push(logEntry);
      
      // שמירת 1000 לוגים אחרונים בלבד
      const recentLogs = logs.slice(-1000);
      await fs.writeFile(this.authLogFile, JSON.stringify(recentLogs, null, 2));
      
      console.log(`📋 Auth attempt logged: ${data.success ? 'SUCCESS' : 'FAILED'} - ${data.email || 'unknown'} from ${data.ip}`);
      
      return logEntry;
    } catch (error) {
      console.error('❌ Failed to log auth attempt:', error);
      return null;
    }
  }

  // רישום מידע מכשיר
  async logDeviceInfo(data) {
    const deviceEntry = {
      id: require('uuid').v4(),
      timestamp: new Date().toISOString(),
      userId: data.userId,
      deviceFingerprint: data.deviceFingerprint,
      ip: data.ip,
      userAgent: data.userAgent?.substring(0, 500) || 'unknown',
      isNewDevice: data.isNewDevice || false,
      location: data.location || null,
      suspicious: data.suspicious || false,
      browserInfo: {
        language: data.language || null,
        platform: data.platform || null,
        screenResolution: data.screenResolution || null,
        timezone: data.timezone || null
      },
      lastSeen: new Date().toISOString(),
      trustLevel: data.trustLevel || 'unknown' // low, medium, high
    };

    try {
      const devices = await this.readLogFile(this.deviceLogFile);
      
      // בדיקה אם המכשיר כבר קיים (עדכון במקום הוספה)
      const existingIndex = devices.findIndex(d => 
        d.deviceFingerprint === deviceEntry.deviceFingerprint && 
        d.userId === deviceEntry.userId
      );

      if (existingIndex >= 0) {
        devices[existingIndex] = { ...devices[existingIndex], ...deviceEntry };
        console.log(`🔄 Device info updated for user ${data.userId}`);
      } else {
        devices.push(deviceEntry);
        console.log(`🆕 New device registered for user ${data.userId}`);
      }
      
      // שמירת 500 מכשירים אחרונים
      const recentDevices = devices.slice(-500);
      await fs.writeFile(this.deviceLogFile, JSON.stringify(recentDevices, null, 2));
      
      return deviceEntry;
    } catch (error) {
      console.error('❌ Failed to log device info:', error);
      return null;
    }
  }

  // ניהול סשנים פעילים
  async logActiveSession(data) {
    const sessionEntry = {
      sessionId: data.sessionId,
      userId: data.userId,
      email: data.email,
      ip: data.ip,
      userAgent: data.userAgent?.substring(0, 200) || 'unknown',
      deviceFingerprint: data.deviceFingerprint || null,
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: data.expiresAt,
      active: true,
      location: data.location || null
    };

    try {
      const sessions = await this.readLogFile(this.sessionLogFile);
      
      // הסרת סשנים ישנים של אותו משתמש (אם רוצים להגביל ל-1 סשן בלבד)
      // const filteredSessions = sessions.filter(s => s.userId !== data.userId);
      
      // הוספת הסשן החדש
      sessions.push(sessionEntry);
      
      // ניקוי סשנים פגי תוקף
      const now = new Date();
      const activeSessions = sessions.filter(s => new Date(s.expiresAt) > now);
      
      await fs.writeFile(this.sessionLogFile, JSON.stringify(activeSessions, null, 2));
      
      console.log(`🔐 Active session logged for user ${data.userId}`);
      return sessionEntry;
    } catch (error) {
      console.error('❌ Failed to log active session:', error);
      return null;
    }
  }

  // קבלת לוגי התחברות (למטרות דשבורד)
  async getAuthLogs(filters = {}) {
    try {
      const logs = await this.readLogFile(this.authLogFile);
      
      let filteredLogs = logs;
      
      // סינון לפי תאריך
      if (filters.fromDate) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) >= new Date(filters.fromDate)
        );
      }
      
      if (filters.toDate) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) <= new Date(filters.toDate)
        );
      }
      
      // סינון לפי הצלחה/כישלון
      if (filters.success !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.success === filters.success);
      }
      
      // סינון לפי משתמש
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      
      // סינון לפי IP
      if (filters.ip) {
        filteredLogs = filteredLogs.filter(log => log.ip === filters.ip);
      }
      
      // מיון לפי תאריך (החדש ביותר ראשון)
      return filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('❌ Failed to get auth logs:', error);
      return [];
    }
  }

  // קבלת סשנים פעילים
  async getActiveSessions(userId = null) {
    try {
      const sessions = await this.readLogFile(this.sessionLogFile);
      const now = new Date();
      
      // סינון סשנים פעילים בלבד
      let activeSessions = sessions.filter(s => 
        s.active && new Date(s.expiresAt) > now
      );
      
      // סינון לפי משתמש אם נדרש
      if (userId) {
        activeSessions = activeSessions.filter(s => s.userId === userId);
      }
      
      return activeSessions;
    } catch (error) {
      console.error('❌ Failed to get active sessions:', error);
      return [];
    }
  }

  // סטטיסטיקות אבטחה
  async getSecurityStats(timeFrame = 24) { // שעות אחרונות
    try {
      const logs = await this.readLogFile(this.authLogFile);
      const since = new Date(Date.now() - timeFrame * 60 * 60 * 1000);
      
      const recentLogs = logs.filter(log => new Date(log.timestamp) >= since);
      
      const stats = {
        totalAttempts: recentLogs.length,
        successfulLogins: recentLogs.filter(log => log.success).length,
        failedLogins: recentLogs.filter(log => !log.success).length,
        uniqueUsers: new Set(recentLogs.filter(log => log.userId).map(log => log.userId)).size,
        uniqueIPs: new Set(recentLogs.map(log => log.ip)).size,
        suspiciousActivity: recentLogs.filter(log => log.suspicious).length,
        timeFrame: `${timeFrame} hours`
      };
      
      stats.successRate = stats.totalAttempts > 0 ? 
        (stats.successfulLogins / stats.totalAttempts * 100).toFixed(2) + '%' : '0%';
      
      return stats;
    } catch (error) {
      console.error('❌ Failed to get security stats:', error);
      return null;
    }
  }

  // עזר לקריאת קבצי JSON
  async readLogFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Failed to read log file ${filePath}:`, error);
      return [];
    }
  }

  // ניקוי לוגים ישנים (לצורכי תחזוקה)
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      // ניקוי לוגי התחברות
      const authLogs = await this.readLogFile(this.authLogFile);
      const recentAuthLogs = authLogs.filter(log => new Date(log.timestamp) > cutoffDate);
      await fs.writeFile(this.authLogFile, JSON.stringify(recentAuthLogs, null, 2));
      
      console.log(`🧹 Cleaned up old logs, kept ${recentAuthLogs.length} auth logs from last ${daysToKeep} days`);
      
      return {
        authLogsRemaining: recentAuthLogs.length,
        cleanupDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to cleanup old logs:', error);
      return null;
    }
  }
}

module.exports = new DatabaseLogger();
