import React, { useEffect, useRef, useState } from "react";
import { useFocusTrap } from '../../../a11y/useFocusTrap';
import { useComposer } from '../../../context/ComposerContext';
import { combineDateTime, scheduleReminderIfPossible } from "../../../lib/reminders";
import { useI18n } from '../../../i18n/I18nProvider';

/**
 * ComposerSheet — דיאלוג יצירת משימה חדשה (container-bound)
 * Props:
 *  - open: boolean
 *  - value: string (כותרת המשימה)
 *  - onChange: (next: string) => void
 *  - onSave: () => Promise<boolean> | boolean   // מחזיר false אם לא לשמור/להשאיר פתוח
 *  - onClose: () => void
 *  - triggerRef?: React.RefObject<HTMLElement>  // fab להחזרת פוקוס
 */
export default function ComposerSheet({ onSave, onFirstReminderAttempt, triggerRef }) {
  const { isOpen: open, closeComposer } = useComposer();
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const sheetRef = useRef(null);
  const inputRef = useRef(null);
  // Local reminder date/time (basic placeholders until UI implemented)
  const [reminderDate, setReminderDate] = useState(null); // Date object
  const [reminderTime, setReminderTime] = useState(null); // string HH:mm

  const currentTitle = title;
  const { t } = useI18n();
  const canSave = currentTitle.trim().length > 0;

  // scroll lock על ה-wrapper
  useEffect(() => {
    const wrapper = document.querySelector('.google-tasks-wrapper');
    if (!wrapper) return;
    if (open) wrapper.classList.add('is-composer-open');
    else wrapper.classList.remove('is-composer-open');
    return () => wrapper.classList.remove('is-composer-open');
  }, [open]);

  // listen for open event
  // Sync context open state into local (for exit animation if needed later)
  useEffect(() => { setInternalOpen(open); if(!open){ setTitle(""); setReminderDate(null); setReminderTime(null);} }, [open]);

  // ESC handling only; focus trap handles tab loop
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useFocusTrap(sheetRef, { active: open, initialFocus: null, returnFocusTo: triggerRef?.current || null });

  const close = () => { closeComposer(); };
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) close(); };

  const handleSave = async () => {
    let reminderAt = null;
    if (reminderDate && reminderTime) {
      try { await onFirstReminderAttempt?.(); } catch {/* noop */}
      try { reminderAt = combineDateTime(reminderDate, reminderTime); } catch {/* ignore */}
    }
  const result = await (onSave?.({ title: currentTitle, reminderAt }) ?? { id: Date.now().toString(), title: currentTitle });
    if (result && result.id && reminderAt) {
      // schedule with stable taskId
      try { await scheduleReminderIfPossible({ taskId: result.id, title: result.title || currentTitle, at: reminderAt }); } catch {/* ignore */}
    }
  if (result !== false) close();
  };

  return (
    <div className={`gt-overlay ${internalOpen ? 'open' : ''}`} onClick={handleOverlayClick} aria-hidden={!internalOpen} hidden={!internalOpen}>
      <div ref={sheetRef} className={`gt-composer ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label={t('dialog.createTask.title')} dir="rtl">
        <div className="gt-compose-title">{t('dialog.createTask.title')}</div>

  <label className="sr-only" htmlFor="gt-title-input">{t('dialog.createTask.title')}</label>
        <input
          id="gt-title-input"
          ref={inputRef}
          className="gt-compose-input"
          placeholder={t('actions.addTask')}
          value={currentTitle}
          onChange={(e) => setTitle(e.target.value)}
          autoComplete="off"
          inputMode="text"
        />

        <div className="gt-compose-actions">
          {/* ב־RTL הכפתור מופיע "שמאלית" ויזואלית */}
          <button
            type="button"
            className={`gt-btn-save ${canSave ? "enabled" : ""}`}
            onClick={handleSave}
            disabled={!canSave}
          >
            {t('actions.add')}
          </button>

          <div className="gt-icon-row" aria-hidden="true">
            <button type="button" className="gt-icon-btn" title="כוכב">
              ★
            </button>
            <button
              type="button"
              className="gt-icon-btn"
              title="תאריך ושעה"
              onClick={() => {
                // TEMP simple demo: set a reminder 2 minutes from now if none chosen
                if (!reminderDate || !reminderTime) {
                  const d = new Date(Date.now() + 2 * 60000);
                  const hh = String(d.getHours()).padStart(2, '0');
                  const mm = String(d.getMinutes()).padStart(2, '0');
                  setReminderDate(d);
                  setReminderTime(`${hh}:${mm}`);
                } else {
                  // toggle off
                  setReminderDate(null);
                  setReminderTime(null);
                }
              }}
            >
              {reminderDate && reminderTime ? '⏱' : '🕒'}
            </button>
            <button type="button" className="gt-icon-btn" title="עוד">
              ≡
            </button>
          </div>
        </div>
        {reminderDate && reminderTime && (
          <div className="gt-reminder-preview" aria-live="polite">
            תזכורת תקבע ל־{reminderDate.toLocaleDateString('he-IL')} {reminderTime}
          </div>
        )}
      </div>
    </div>
  );
}
