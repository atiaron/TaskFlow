import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthService from '../services/AuthService';

/**
 * LoginScreen
 * Simple auth UI (RTL) with:
 *  - Email quick login (mock)
 *  - OAuth provider buttons (filtered by support)
 *  - Guest mode
 */
export default function LoginScreen({ loading=false }){
  const { loginWithEmail, loginGuest, loginWithProvider, status, error } = useAuth();
  const [email, setEmail] = React.useState('');
  const [localError, setLocalError] = React.useState(null);

  const providers = React.useMemo(() => {
    const map = (typeof AuthService.getOAuthProviders === 'function') ? AuthService.getOAuthProviders() : {};
    return Object.entries(map);
  }, []);

  async function handleEmail(e){
    e.preventDefault();
    if(!email.trim()) { setLocalError('נא להזין אימייל'); return; }
    setLocalError(null);
    await loginWithEmail(email.trim());
  }

  return (
    <div className="gt-login" dir="rtl">
      <div className="gt-login__panel" role="dialog" aria-labelledby="loginTitle">
        <h1 id="loginTitle" className="gt-login__title">TaskFlow</h1>
        <p className="gt-login__subtitle">התחבר כדי לנהל משימות</p>
        <form onSubmit={handleEmail} className="gt-login__form" noValidate>
          <label className="gt-field">
            <span className="gt-field__label">אימייל</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              className="gt-field__control"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={status==='loading'}
              required
            />
          </label>
          {(localError || error) && <div className="gt-login__error" role="alert">{localError || error}</div>}
          <button type="submit" className="gt-btn gt-btn--primary" disabled={status==='loading'}>
            {status==='loading' ? 'מתחבר…' : 'כניסה' }
          </button>
        </form>
        {providers.length > 0 && (
          <div className="gt-login__oauth">
            <div className="gt-login__divider"><span>או</span></div>
            <div className="gt-login__providers">
              {providers.map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  className="gt-oauthBtn"
                  style={{ '--oauth-color': cfg.color, '--oauth-text': cfg.textColor }}
                  onClick={() => loginWithProvider(key)}
                  disabled={status==='loading'}
                >{cfg.name}</button>
              ))}
            </div>
          </div>
        )}
        <div className="gt-login__guest">
          <button type="button" className="gt-btn gt-btn--ghost" onClick={loginGuest} disabled={status==='loading'}>
            מצב אורח
          </button>
        </div>
      </div>
    </div>
  );
}
