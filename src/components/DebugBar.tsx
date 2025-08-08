import React from 'react';
import AuthProvider from '../services/AuthProvider';

/**
 * DebugBar - אינדיקטור דיבאג לפיתוח
 * מציג מצב loading, user, tokens בזמן אמת
 */
export default function DebugBar() {
  // רק בפיתוח
  if (process.env.NODE_ENV !== 'development') return null;

  const user = AuthProvider.getCurrentUser();
  const access = !!(sessionStorage.getItem('tf-access-token') || sessionStorage.getItem('tf-access'));
  const refresh = !!(sessionStorage.getItem('tf-refresh-token') || sessionStorage.getItem('tf-refresh'));
  const authMode = AuthProvider.getAuthMode();
  const isAuth = AuthProvider.isAuthenticated();

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      fontSize: 11,
      padding: '4px 8px',
      background: '#111',
      color: '#0f0',
      opacity: 0.85,
      fontFamily: 'monospace',
      zIndex: 9999,
      borderTop: '1px solid #333'
    }}>
      <span style={{ color: '#0ff' }}>🔧 DEV:</span> {' '}
      <span style={{ color: isAuth ? '#0f0' : '#f80' }}>auth={String(isAuth)}</span> | {' '}
      <span>user={user?.email || 'anon'}</span> | {' '}
      <span style={{ color: access ? '#0f0' : '#f80' }}>access={String(access)}</span> | {' '}
      <span style={{ color: refresh ? '#0f0' : '#f80' }}>refresh={String(refresh)}</span> | {' '}
      <span>mode={authMode}</span> | {' '}
      <span style={{ color: document.body.classList.contains('app-loaded') ? '#0f0' : '#f80' }}>
        html-loaded={String(document.body.classList.contains('app-loaded'))}
      </span>
    </div>
  );
}
