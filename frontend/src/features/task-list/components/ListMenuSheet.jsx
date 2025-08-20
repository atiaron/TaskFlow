import React, { useEffect, useRef } from 'react';
import { useFocusTrap } from '../../../a11y/useFocusTrap';
import { useSettings } from '../../../context/SettingsContext';

export default function ListMenuSheet({ onClearCompleted }) {
  const { isListMenuOpen: open, closeListMenu } = useSettings();
  const sheetRef = useRef(null);
  useFocusTrap(sheetRef, { active: open, returnFocusTo: null });
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') closeListMenu(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeListMenu]);

  const clearCompleted = () => {
    onClearCompleted?.();
    closeListMenu();
    requestAnimationFrame(() => { const btn = document.querySelector('.gt-list-actions .menu-dots'); if (btn) btn.focus(); });
  };

  if (!open) return null;
  return (
    <>
  <div className="gt-overlay is-open" aria-hidden="true" onClick={() => { closeListMenu(); requestAnimationFrame(()=>{ const btn = document.querySelector('.gt-list-actions .menu-dots'); if(btn) btn.focus();}); }} />
  <div ref={sheetRef} role="dialog" aria-modal="true" aria-label="תפריט רשימה" className="gt-sheet gt-list-menu-sheet is-open">
        <button type="button" className="gt-row-link" onClick={clearCompleted}>נקה משימות שהושלמו</button>
        <button type="button" className="gt-row-link" onClick={closeListMenu}>סגור</button>
      </div>
    </>
  );
}
