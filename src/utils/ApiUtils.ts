/**
 * API Utils - Environment-aware API calling
 * מנהל קריאות API בצורה חכמה לפי הסביבה
 */

export class ApiUtils {
  private static getBaseUrl(): string {
    // בסביבת פיתוח - יעבור דרך proxy או ישירות ללוקלהוסט  
    if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_IS_DEV_MODE === 'true') {
      // אם יש proxy ב-craco, נשתמש ב-relative URLs
      // אחרת נשתמש בURL מלא
      return process.env.REACT_APP_API_URL || 'http://localhost:4000';
    }
    
    // בסביבת פרודקשן - נשתמש ב-Vercel Functions או external API
    const productionApiUrl = process.env.REACT_APP_API_URL || 
                           process.env.REACT_APP_BACKEND_URL || 
                           'https://taskflow-backend.vercel.app';
    
    return productionApiUrl;
  }

  /**
   * בונה URL מלא לAPI endpoint
   */
  static buildApiUrl(endpoint: string): string {
    const baseUrl = this.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // בdev, נשתמש ב-relative URL אם אפשר (דרך proxy)
    if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_USE_FULL_API_URLS) {
      return `/api${cleanEndpoint}`;
    }
    
    return `${baseUrl}${cleanEndpoint}`;
  }

  /**
   * Fetch עם error handling חכם
   */
  static async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = this.buildApiUrl(endpoint);
    
    console.log('🌐 API Call:', { 
      endpoint, 
      url, 
      method: options.method || 'GET',
      env: process.env.NODE_ENV 
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('🚨 API Call Failed:', { endpoint, url, error });
      
      // בdev, אם הקריאה נכשלה דרך proxy, ננסה ישירות
      if (process.env.NODE_ENV === 'development' && !url.includes('localhost:4000')) {
        console.log('🔄 Retrying with direct localhost URL...');
        const directUrl = `http://localhost:4000${endpoint}`;
        return fetch(directUrl, options);
      }
      
      throw error;
    }
  }
}

export default ApiUtils;
