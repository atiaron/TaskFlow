import React, { createContext, useContext, useMemo, useState } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const api = useMemo(() => ({
    show(text, opts) {
      const t = { id: (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)), text, ...opts };
      setToasts(prev => [...prev, t]);
      const ttl = opts?.ttl ?? 4000;
      if (ttl > 0) setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), ttl);
    },
    dismiss(id){ setToasts(prev => prev.filter(t => t.id !== id)); }
  }), []);
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="gt-toastLayer" aria-live="polite" dir="rtl">
        {toasts.map(t => {
          const isError = t.isError || t.variant === 'error';
            return (
              <div
                key={t.id}
                className="gt-toast is-open"
                role={t.role || (isError ? 'alert' : 'status')}
                aria-live={isError ? 'assertive' : 'polite'}
              >
                <span className="gt-toast__msg">{t.text}</span>
                {t.action && <button className="gt-toast__action" onClick={t.action.onClick}>{t.action.label}</button>}
                <button className="gt-toastClose" aria-label="סגור התראה" onClick={() => api.dismiss(t.id)}>✕</button>
              </div>
            );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() { const v = useContext(ToastCtx); if (!v) throw new Error('ToastProvider missing'); return v; }
