import React, { useEffect } from 'react';

export default function Snackbar({
  open,
  message,
  actionLabel = 'בטל',
  onAction,
  onClose,
  duration = 3500,
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  return (
    <div className={`gt-toast ${open ? 'is-open' : ''}`} role="status" aria-live="polite" dir="rtl">
      <span className="gt-toast__msg">{message}</span>
      {onAction && (
        <button
          className="gt-toast__action"
          type="button"
          onClick={onAction}
          aria-label={actionLabel}
          data-testid="toast-undo"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
