import axios from 'axios';
import { ApiUtils } from '../utils/ApiUtils';

export const api = axios.create({
  baseURL: ApiUtils.getApiUrl(), // שימוש בפונקציה הקיימת
  withCredentials: false, // מכיוון שלא משתמשים בcookies
  timeout: 30000, // 30 seconds timeout
});

let refreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

/**
 * הגדרת Authorization header
 */
function setAuthHeader(token?: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

/**
 * Helper functions לקריאת tokens עם תאימות לאחור
 */
function readAccessToken(): string | null {
  return sessionStorage.getItem('tf-access-token') || sessionStorage.getItem('tf-access');
}

function readRefreshToken(): string | null {
  return sessionStorage.getItem('tf-refresh-token') || sessionStorage.getItem('tf-refresh');
}

/**
 * Request Interceptor - הוספת Bearer token לכל בקשה
 */
api.interceptors.request.use(
  (config) => {
    const accessToken = readAccessToken();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    // לוג לdevelopment
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔗 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - טיפול באימות מחדש אוטומטי
 */
api.interceptors.response.use(
  (response) => {
    // בקשה הצליחה
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // אם 401 ולא ניסינו כבר refresh
    if (error?.response?.status === 401 && !originalRequest.__isRetry) {
      
      // אם כבר מבצעים refresh, נכנס לתור
      if (refreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string | null) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              originalRequest.__isRetry = true;
              resolve(api(originalRequest));
            } else {
              resolve(Promise.reject(error));
            }
          });
        });
      }
      
      // מתחילים refresh
      refreshing = true;
      
      try {
        const refreshToken = readRefreshToken();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        console.log('🔄 Attempting token refresh...');
        
        // קריאה ל-refresh endpoint
        const refreshResponse = await api.post('/auth/refresh', { 
          refreshToken 
        });
        
        const { accessToken } = refreshResponse.data;
        
        // עדכון הtoken החדש
        sessionStorage.setItem('tf-access-token', accessToken);
        setAuthHeader(accessToken);
        
        // עיבוד התור
        refreshQueue.forEach((callback) => callback(accessToken));
        refreshQueue = [];
        refreshing = false;
        
        // ניסיון חוזר של הבקשה המקורית
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        originalRequest.__isRetry = true;
        
        console.log('✅ Token refresh successful, retrying original request');
        
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // מנקה הכל ומודיע לתור שנכשל
        refreshing = false;
        refreshQueue.forEach((callback) => callback(null));
        refreshQueue = [];
        
        // מנקה את הstorage
        sessionStorage.removeItem('tf-access-token');
        sessionStorage.removeItem('tf-refresh-token');
        setAuthHeader(null);
        
        // אופציונלי: redirect לlogout או התנהלות נוספת
        if (process.env.NODE_ENV === 'development') {
          console.warn('🚪 Auto-logout triggered due to refresh failure');
        }
        
        // חזרה לשגיאה המקורית
        return Promise.reject(error);
      }
    }
    
    // שגיאות אחרות
    return Promise.reject(error);
  }
);

/**
 * Helper function לניקוי tokens מהstorage
 */
export function clearAuthTokens() {
  sessionStorage.removeItem('tf-access-token');
  sessionStorage.removeItem('tf-refresh-token');
  setAuthHeader(null);
  console.log('🧹 Auth tokens cleared');
}

/**
 * Helper function להגדרת tokens חדשים
 */
export function setAuthTokens(accessToken: string, refreshToken: string) {
  sessionStorage.setItem('tf-access-token', accessToken);
  sessionStorage.setItem('tf-refresh-token', refreshToken);
  setAuthHeader(accessToken);
  console.log('🔑 Auth tokens set');
}

/**
 * בדיקה האם יש token תקף
 */
export function hasValidToken(): boolean {
  const accessToken = readAccessToken();
  const refreshToken = readRefreshToken();
  return !!(accessToken && refreshToken);
}

export default api;
