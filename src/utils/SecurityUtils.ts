// Security utilities for TaskFlow
export class SecurityUtils {
  
  // בדיקה אם זה מכשיר חדש
  static isNewDevice(): boolean {
    const deviceId = sessionStorage.getItem('taskflow-device-id') || localStorage.getItem('taskflow-device-id');
    const lastSeen = localStorage.getItem('taskflow-last-seen');
    
    if (!deviceId || !lastSeen) {
      return true;
    }
    
    // בדיקה אם עברו יותר מ-30 יום
    const daysSinceLastSeen = (Date.now() - parseInt(lastSeen)) / (1000 * 60 * 60 * 24);
    return daysSinceLastSeen > 30;
  }
  
  // יצירת fingerprint למכשיר
  static generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('TaskFlow Security Check', 10, 10);
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL(),
      timestamp: Date.now()
    };
    
    return btoa(JSON.stringify(fingerprint)).substring(0, 32);
  }
  
  // רישום מכשיר חדש
  static registerDevice(): void {
    const deviceId = this.generateDeviceFingerprint();
    const timestamp = Date.now().toString();
    
    sessionStorage.setItem('taskflow-device-id', deviceId);
    localStorage.setItem('taskflow-device-id', deviceId);
    localStorage.setItem('taskflow-last-seen', timestamp);
    localStorage.setItem('taskflow-device-registered', timestamp);
    
    console.log('🔐 Device registered with fingerprint:', deviceId.substring(0, 8) + '...');
  }
  
  // בדיקת אבטחת HTTPS
  static isSecureConnection(): boolean {
    return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  }
  
  // זיהוי VPN/Proxy (בסיסי)
  static async detectVPN(): Promise<boolean> {
    try {
      // בדיקה בסיסית של זמן התגובה
      const start = Date.now();
      await fetch('https://www.google.com/generate_204', { mode: 'no-cors' });
      const responseTime = Date.now() - start;
      
      // זמן תגובה חשוד (יותר מ-500ms לGoogle)
      return responseTime > 500;
    } catch {
      return false;
    }
  }
  
  // יצירת לוג אבטחה
  static logSecurityEvent(event: string, details: any = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent.substring(0, 100),
      url: window.location.href,
      deviceId: sessionStorage.getItem('taskflow-device-id')?.substring(0, 8)
    };
    
    console.log('🛡️ Security Event:', logEntry);
    
    // שמירה ללוגים מקומיים (מוגבל ל-100 כניסות)
    try {
      const logs = JSON.parse(localStorage.getItem('taskflow-security-logs') || '[]');
      logs.push(logEntry);
      
      // שמירת 100 לוגים אחרונים בלבד
      const recentLogs = logs.slice(-100);
      localStorage.setItem('taskflow-security-logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to save security log:', error);
    }
  }
  
  // שליחת מידע אבטחה לשרת
  static async sendSecurityInfo(): Promise<void> {
    try {
      // Skip in development mode
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        console.log('🛡️ Security info send skipped in development mode');
        return;
      }
      
      const deviceInfo = {
        fingerprint: this.generateDeviceFingerprint(),
        isNewDevice: this.isNewDevice(),
        secureConnection: this.isSecureConnection(),
        suspiciousActivity: await this.detectVPN()
      };
      
      // Use ApiUtils for environment-aware URL handling
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3333' 
        : (process.env.REACT_APP_API_URL || 'https://taskflow-backend.vercel.app');
      
      await fetch(`${apiUrl}/api/auth/device-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceInfo)
      });
      
      this.logSecurityEvent('device_info_sent', deviceInfo);
    } catch (error: any) {
      this.logSecurityEvent('device_info_failed', { error: error?.message || 'Unknown error' });
    }
  }
}
