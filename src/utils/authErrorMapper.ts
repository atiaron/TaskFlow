/**
 * Auth Error Mapper - ממפה שגיאות טכניות להודעות גנריות וידידותיות למשתמש
 * מטרה: לא לחשוף מידע טכני, להציג 3 הודעות בלבד
 */

export interface AuthError {
  message?: string;
  code?: string;
  response?: {
    status?: number;
    data?: any;
  };
  request?: any;
}

/**
 * ממפה שגיאת אימות להודעה גנרית למשתמש
 * @param error השגיאה שהתקבלה
 * @param isDevelopment האם זה מצב פיתוח (להוספת פרטים טכניים)
 * @returns הודעה גנרית למשתמש
 */
export function mapAuthErrorToMessage(error?: AuthError, isDevelopment: boolean = false): string {
  // אם אין שגיאה, החזר הודעה כללית
  if (!error) {
    return 'כניסה נכשלה, נסו שוב.';
  }

  const status = error.response?.status;
  const message = error.message || '';
  const code = error.code || '';

  // בדיקת שגיאות רשת
  const isNetworkError = 
    code === 'ERR_NETWORK' || 
    code === 'NETWORK_ERROR' ||
    message.includes('Network') || 
    message.includes('Failed to fetch') ||
    message.includes('fetch') ||
    status === 0 ||
    !error.response; // אין response כלל

  // בדיקת timeout
  const isTimeoutError = 
    code === 'ECONNABORTED' ||
    message.includes('timeout') ||
    message.includes('Timeout');

  // Rate limiting
  if (status === 429) {
    return 'יותר מדי ניסיונות, המתינו רגע ונסו שוב.';
  }

  // שגיאות רשת או timeout
  if (isNetworkError || isTimeoutError) {
    return 'שגיאת רשת, בדקו חיבור ונסו שוב.';
  }

  // במצב פיתוח, תן פרטים נוספים למפתחים
  if (isDevelopment) {
    if (status) {
      return `כניסה נכשלה במצב פיתוח (${status}). בדוק את הקונסול.`;
    }
    return 'כניסה נכשלה במצב פיתוח. בדוק את הקונסול.';
  }

  // הודעה כללית לכל השאר (400, 401, 403, 500, וכו')
  return 'כניסה נכשלה, נסו שוב.';
}

/**
 * רושם שגיאה טכנית לקונסול לצרכי debugging
 * @param error השגיאה שהתקבלה
 * @param context הקשר נוסף (למשל "login_attempt")
 */
export function logAuthError(error: AuthError, context: string = 'auth'): void {
  console.group(`❌ Auth Error [${context}]`);
  console.error('Full error object:', error);
  
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', error.response.data);
  }
  
  if (error.request) {
    console.error('Request details:', error.request);
  }
  
  console.error('Error message:', error.message);
  console.error('Error code:', error.code);
  console.groupEnd();
}

/**
 * עוזר לזיהוי סוג השגיאה לצרכי לוגים
 */
export function getErrorType(error: AuthError): string {
  const status = error.response?.status;
  const code = error.code || '';
  const message = error.message || '';

  if (status === 429) return 'RATE_LIMIT';
  if (code === 'ERR_NETWORK' || !error.response) return 'NETWORK_ERROR';
  if (code === 'ECONNABORTED' || message.includes('timeout')) return 'TIMEOUT';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 400) return 'BAD_REQUEST';
  if (status && status >= 500) return 'SERVER_ERROR';
  
  return 'UNKNOWN_ERROR';
}
