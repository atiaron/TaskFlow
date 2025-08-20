import React from 'react';
import { kv, migrateLegacyKey } from '../storage/kvStore';
import AuthService from '../services/AuthService';
import OAuthService from '../services/OAuthService';

/**
 * AuthContext
 * Lightweight client auth state wrapper atop existing services.
 * Supports: email (mock), oauth provider (mock/dev), guest session.
 * Persists minimal user object in localStorage (key: tf_user) + tokens if provided.
 */
const AuthContext = React.createContext(null);

function loadStoredUser(){
  migrateLegacyKey('tf_user', 'tf__auth_user');
  try { return kv.getJSON('auth_user'); } catch { return null; }
}

export function AuthProvider({ children }){
  const [user, setUser] = React.useState(() => loadStoredUser());
  const [status, setStatus] = React.useState(user ? 'authenticated' : 'anonymous'); // anonymous | loading | authenticated
  const [error, setError] = React.useState(null);

  // Basic effect: could verify token later.
  React.useEffect(() => {
    // If there is a token but no user object, attempt decode (future TODO)
  }, []);

  function persist(next){
    if(next) kv.setJSON('auth_user', next); else kv.remove('auth_user');
  }

  async function loginWithEmail(email){
    setStatus('loading'); setError(null);
    try {
      // Mock email login — in absence of backend endpoint we fabricate user.
      const mockUser = {
        id: 'email-' + btoa(email).slice(0,8),
        email,
        displayName: email.split('@')[0],
        provider: 'email',
        createdAt: Date.now()
      };
      persist(mockUser);
      setUser(mockUser);
      setStatus('authenticated');
      return { success: true, user: mockUser };
    } catch(e){
      setError(e.message || 'Login failed');
      setStatus('anonymous');
      return { success: false, error: e.message };
    }
  }

  async function loginWithProvider(provider){
    setStatus('loading'); setError(null);
    try {
      const result = await OAuthService.signInWithProvider(provider);
      if(!result.success) throw new Error(result.error || 'OAuth failed');
      // Exchange token via AuthService (if backend available)
      let exchanged = null;
      try {
        exchanged = await AuthService.login({ idToken: result.idToken, provider });
      } catch(ex) {
        // fallback to firebase user only
      }
      const rawUser = result.user;
      const userObj = {
        id: rawUser.uid || rawUser.id || 'uid-'+Date.now(),
        email: rawUser.email,
        displayName: rawUser.displayName || rawUser.email?.split('@')[0],
        photoURL: rawUser.photoURL || null,
        provider,
      };
      persist(userObj);
      setUser(userObj);
      setStatus('authenticated');
      if(exchanged?.accessToken){
        migrateLegacyKey('accessToken', 'tf__auth_accessToken');
        migrateLegacyKey('refreshToken', 'tf__auth_refreshToken');
        kv.set('auth_accessToken', exchanged.accessToken);
        if(exchanged.refreshToken) kv.set('auth_refreshToken', exchanged.refreshToken);
      }
      return { success: true, user: userObj };
    } catch(e){
      setError(e.message || 'OAuth login failed');
      setStatus('anonymous');
      return { success: false, error: e.message };
    }
  }

  async function loginGuest(){
    setStatus('loading'); setError(null);
    const guest = { id: 'guest', displayName: 'אורח', provider: 'guest' };
    persist(guest);
    setUser(guest);
    setStatus('authenticated');
    return { success: true, user: guest };
  }

  async function logout(){
    setStatus('loading');
    try { await AuthService.logout(); } catch {}
    persist(null);
    setUser(null);
    setStatus('anonymous');
  }

  const value = React.useMemo(() => ({
    user,
    status,
    error,
    isAuthenticated: status === 'authenticated' && !!user,
    loginWithEmail,
    loginWithProvider,
    loginGuest,
    logout,
  }), [user, status, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(){
  const ctx = React.useContext(AuthContext);
  if(!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
