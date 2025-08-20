import React, { createContext, useContext, useMemo, useState } from 'react';

export type ToastAction = { label: string; onClick: () => void };
export type Toast = { id: string; text: string; action?: ToastAction; ttl?: number };

interface ToastApi { show: (text: string, opts?: { action?: ToastAction; ttl?: number }) => void; }

const ToastCtx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const api = useMemo<ToastApi>(() => ({
    show(text, opts) {
      const t: Toast = { id: (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)), text, ...opts };
      setToasts(prev => [...prev, t]);
      const ttl = opts?.ttl ?? 4000;
      if (ttl > 0) setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), ttl);
    }
  }), []);
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="gt-toastLayer" aria-live="polite" dir="rtl">
        {toasts.map(t => (
          <div key={t.id} className="gt-toast is-open" role="status">
            <span className="gt-toast__msg">{t.text}</span>
            {t.action && <button className="gt-toast__action" onClick={t.action.onClick}>{t.action.label}</button>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() { const v = useContext(ToastCtx); if (!v) throw new Error('ToastProvider missing'); return v; }
