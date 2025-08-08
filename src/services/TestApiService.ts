import api from './http';

export class TestApiService {
  /**
   * Ping endpoint מוגן לבדיקת Auth
   */
  static async ping() {
    try {
      const response = await api.get('/ping');
      return response.data;
    } catch (error: any) {
      console.error('❌ Ping failed:', error);
      throw error;
    }
  }

  /**
   * בדיקת health endpoint (ללא auth)
   */
  static async health() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error: any) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  /**
   * מחליף token כוזב לבדיקת 401
   */
  static corruptAccessToken() {
    const current = sessionStorage.getItem('tf-access-token');
    if (current) {
      sessionStorage.setItem('tf-access-token', 'fake-token-for-testing');
      console.log('🧪 Access token corrupted for testing');
      return current; // מחזיר את המקורי לשחזור
    }
    return null;
  }

  /**
   * משחזר token מקורי
   */
  static restoreAccessToken(originalToken: string | null) {
    if (originalToken) {
      sessionStorage.setItem('tf-access-token', originalToken);
      console.log('🔧 Access token restored');
    }
  }

  /**
   * מבצע מספר קריאות במקביל לבדיקת concurrent queue
   */
  static async testConcurrentRequests() {
    console.log('🔬 Testing concurrent requests...');
    
    const promises = [
      this.ping(),
      this.ping(),
      this.ping()
    ];

    try {
      const results = await Promise.all(promises);
      console.log('✅ All concurrent requests succeeded:', results);
      return results;
    } catch (error) {
      console.error('❌ Concurrent requests failed:', error);
      throw error;
    }
  }
}
