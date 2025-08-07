const MockAuth = {
  login: async () => {
    console.log('🔧 MockAuth: login called');
    return {
      id: 'dev-user',
      name: 'Dev דמו',
      email: 'dev@taskflow.com',
      token: 'dev-token-123',
      roles: ['admin'],
    };
  },
  logout: async () => {
    console.log('🔧 MockAuth: logout called');
  },
  getUser: () => {
    console.log('🔧 MockAuth: getUser called');
    return {
      id: 'dev-user',
      name: 'Dev דמו',
      email: 'dev@taskflow.com',
      roles: ['admin'],
    };
  },
  isAuthenticated: () => {
    console.log('🔧 MockAuth: isAuthenticated called');
    return true;
  },
  
  getCurrentUser: () => {
    console.log('🔧 MockAuth: getCurrentUser called');
    return {
      id: 'dev-user',
      name: 'Dev דמו',
      email: 'dev@taskflow.com',
      roles: ['admin'],
    };
  },
  
  // פונקציות נוספות שה-App צריך
  initializeGoogleAuth: async () => {
    console.log('🔧 MockAuth: initializeGoogleAuth called - skipping in dev mode');
    return Promise.resolve();
  },
  
  onAuthStateChanged: (callback: Function) => {
    console.log('🔧 MockAuth: onAuthStateChanged called - will auto-login in 1 second');
    
    // במצב dev, נקרא מיד ל-callback עם משתמש מדומה
    const timeoutId = setTimeout(() => {
      console.log('🔧 MockAuth: triggering auth state change with dev user');
      callback({
        id: 'dev-user',
        name: 'Dev דמו',
        email: 'dev@taskflow.com',
        token: 'dev-token-123',
        roles: ['admin'],
      });
    }, 1000); // עיכוב של שנייה
    
    // return unsubscribe function
    return () => {
      console.log('🔧 MockAuth: auth listener unsubscribed');
      clearTimeout(timeoutId);
    };
  }
};

export default MockAuth;
