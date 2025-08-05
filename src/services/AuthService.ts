// עדכן את הגדרות Google OAuth
export class AuthService {
  private static CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // עדכן עם הClient ID האמיתי

  static async initializeGoogleAuth(): Promise<boolean> {
    try {
      // בדוק אם Google API זמין
      if (typeof window.google === 'undefined') {
        console.log('Google API not loaded');
        return false;
      }

      // הגדר את הclient
      await window.google.accounts.id.initialize({
        client_id: this.CLIENT_ID,
        callback: this.handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      console.log('✅ Google Auth initialized');
      return true;
    } catch (error) {
      console.error('❌ Google Auth initialization failed:', error);
      return false;
    }
  }

  private static handleGoogleResponse = (response: any) => {
    try {
      const token = response.credential;
      // פענח את הtoken וחלץ מידע על המשתמש
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      const user = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture
      };

      // שמור במקומי
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('auth_token', token);
      
      console.log('✅ User signed in:', user);
      
      // רענן את הדף או עדכן את המצב
      window.location.reload();
    } catch (error) {
      console.error('❌ Google auth response error:', error);
    }
  };

  static signOut(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    window.location.reload();
  }
}