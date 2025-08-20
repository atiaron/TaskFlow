import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './bottom-sheet.css';

export default function BottomSheet({
  open,
  onClose,
  onRename,
  onClearCompleted,
  canDeleteList = false,
  triggerRef, // ref לכפתור ⋮ שממנו נפתח הסדין
}) {
  const wrapper = document.querySelector('.google-tasks-wrapper');
  const overlayRef = useRef(null);
  const sheetRef = useRef(null);
  const firstBtnRef = useRef(null);

  // Scroll-lock + aria-hidden
  useEffect(() => {
    if (!wrapper) return;
    if (open) {
      wrapper.classList.add('is-modal-open');
      wrapper.setAttribute('aria-hidden', 'true');
    } else {
      wrapper.classList.remove('is-modal-open');
      wrapper.removeAttribute('aria-hidden');
    }
    return () => {
      wrapper.classList.remove('is-modal-open');
      wrapper.removeAttribute('aria-hidden');
    };
  }, [open, wrapper]);

  // החזרת פוקוס ל-trigger
  const close = useCallback(() => {
    onClose?.();
    setTimeout(() => triggerRef?.current?.focus?.(), 0);
  }, [onClose, triggerRef]);

  // ESC לסגירה + Focus trap
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
      // Focus trap
      if (e.key === 'Tab' && sheetRef.current) {
        const focusables = sheetRef.current.querySelectorAll(
          'button:not([disabled]),[role="button"]:not([aria-disabled="true"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, close]);

  // פוקוס ראשון בעת פתיחה
  useEffect(() => {
    if (open) setTimeout(() => firstBtnRef.current?.focus?.(), 0);
  }, [open]);

  if (!wrapper) return null;

  const overlay = (
    <div
      className={`gt-overlay ${open ? 'is-open' : ''}`}
      ref={overlayRef}
      onClick={close}
      aria-hidden="true"
    />
  );

  const sheet = (
    <div
      className={`gt-sheet ${open ? 'is-open' : ''}`}
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label="תפריט רשימה"
      dir="rtl"
    >
      <div className="gt-sheet__handle" />
      <div className="gt-sheet__list" role="menu">
        {/* 1) שינוי שם הרשימה */}
        <button
          ref={firstBtnRef}
          className="gt-sheet__item"
          type="button"
          role="menuitem"
          onClick={() => { onRename?.(); close(); }}
        >
          שינוי השם של הרשימה
        </button>

        {/* 2) מחק רשימה – כבוי כברירת מחדל */}
        <div
          className="gt-sheet__item"
          role="menuitem"
          aria-disabled={!canDeleteList}
          onClick={() => { if (canDeleteList) { /* deleteList(); */ close(); } }}
        >
          <div>
            מחק רשימה
            <div className="gt-sheet__sub">
              אי אפשר למחוק את רשימת ברירת המחדל
            </div>
          </div>
        </div>

        {/* 3) מחיקת כל המשימות שהושלמו */}
        <button
          className="gt-sheet__item"
          type="button"
          role="menuitem"
          onClick={() => { onClearCompleted?.(); close(); }}
        >
          מחיקת כל המשימות שהושלמו
        </button>

        {/* 4) ביטול */}
        <button
          className="gt-sheet__item"
          type="button"
          role="menuitem"
          onClick={close}
        >
          ביטול
        </button>
      </div>
    </div>
  );

  return createPortal(
    <>
      {overlay}
      {sheet}
    </>,
    wrapper
  );
}