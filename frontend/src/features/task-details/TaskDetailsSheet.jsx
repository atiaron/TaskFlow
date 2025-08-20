import React, { useEffect, useMemo, useRef, useState } from "react";
import DateTimeSheet from "./DateTimeSheet";
import { combineDateTime, scheduleReminderIfPossible, cancelReminderForTask } from "../../lib/reminders";

export default function TaskDetailsSheet({
  open,
  task,
  onClose,
  onToggleComplete,
  onToggleStar,
  onUpdateTitle,      // אופציונלי לעתיד
  onAddDetails,       // אופציונלי לעתיד
  onAddDue,           // אופציונלי לעדכון חיצוני (נשמר לבאקווארד)
  setDueDate,         // פונקציה חדשה מה-hook (id,date)
  onFirstReminderAttempt, // חדש: ניסיון הרשאת תזכורת
  triggerRef          // אלמנט שפתח את ה-sheet (לשחזור פוקוס)
}) {
  const wrapper = document.querySelector(".google-tasks-wrapper");
  const overlayRef = useRef(null);
  const sheetRef   = useRef(null);
  const firstRef   = useRef(null);
  const lastRef    = useRef(null);
  const prevFocus  = useRef(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [reminderDate, setReminderDate] = useState(task?.reminderAt ? new Date(task.reminderAt) : null);
  const [reminderTime, setReminderTime] = useState(task?.reminderAt ? new Date(task.reminderAt).toTimeString().slice(0,5) : null);

  const isCompleted = !!task?.completed;

  const completedLabel = useMemo(() => {
    if (!task) return "";
    const ts = task.completedAt || task.updatedAt || task.createdAt || Date.now();
    const d  = new Date(ts);
    const txt = d.toLocaleDateString("he-IL", {
      weekday: "short", day: "numeric", month: "short"
    });
    return `בוצעה: ${txt}`;
  }, [task]);

  // פתיחה/סגירה + נעילת גלילה + מלכודת פוקוס
  useEffect(() => {
    if (!wrapper) return;
    const mainEl = document.querySelector('#main');
    const hideTarget = mainEl || null; // אם אין main לא נסמן aria-hidden על wrapper כדי לא להסתיר את הדיאלוג עצמו

    if (open) {
      prevFocus.current = document.activeElement;
      wrapper.classList.add('is-details-open');
      if (hideTarget) {
        hideTarget.setAttribute('aria-hidden', 'true');
        try { hideTarget.setAttribute('inert', ''); } catch {}
      }
      // פוקוס ראשוני
      setTimeout(() => firstRef.current?.focus(), 0);
    } else {
      wrapper.classList.remove('is-details-open');
      if (hideTarget) {
        hideTarget.removeAttribute('aria-hidden');
        try { hideTarget.removeAttribute('inert'); } catch {}
      }
    }

    const onKey = (e) => {
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); handleClose(); }
      if (e.key === 'Tab') {
        const f = firstRef.current, l = lastRef.current;
        if (!f || !l) return;
        if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
        else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      wrapper.classList.remove('is-details-open');
      if (hideTarget) {
        hideTarget.removeAttribute('aria-hidden');
        try { hideTarget.removeAttribute('inert'); } catch {}
      }
      prevFocus.current?.focus?.();
    };
  }, [open]);

  const handleClose = () => {
    onClose?.();
    try { triggerRef?.current?.focus?.(); } catch {}
  };

  if (!open || !task) return null;

  return (
    <>
      <div
        className="gt-overlay is-open"
        ref={overlayRef}
        onClick={handleClose}
        aria-hidden="true"
      />
      <aside
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="פרטי משימה"
        className="gt-task-sheet is-full"
      >
        {/* פס עליון: תפריט ⋮ וסגירה */}
        <div className="gt-task-sheet__top">
          <button className="gt-icon" aria-label="תפריט משימה" ref={firstRef}>⋮</button>
          <button className="gt-icon" aria-label="סגור" onClick={handleClose}>➜</button>
        </div>

        {/* שם הרשימה (תצוגה בלבד כרגע) */}
        <div className="gt-task-sheet__list-name" aria-hidden="true">
          <span className="gt-chevron">▾</span>
          <span>המשימות שלי</span>
        </div>

        {/* כותרת + שורה משנית */}
        <h2 className={"gt-task-title" + (isCompleted ? " is-completed" : "")}>{task.title}</h2>
        {isCompleted && <p className="gt-task-meta">{completedLabel}</p>}

        {/* פעולות עיקריות (דמו/סטאב) */}
        <button
          className="gt-row-action"
          onClick={() => onAddDetails?.(task.id)}
        >
          <span>הוספת פרטים</span>
          <span className="gt-icon">≡</span>
        </button>

        <button
          className="gt-row-action"
          onClick={() => setDateOpen(true)}
        >
          <span>{reminderDate && reminderTime ? "עריכת תאריך ושעה" : "הוספת תאריך ושעה"}</span>
          <span className="gt-icon">🕒</span>
        </button>
        {reminderDate && reminderTime && (
          <div className="gt-reminder-inline" aria-live="polite">
            תזכורת: {reminderDate.toLocaleDateString('he-IL')} {reminderTime}
          </div>
        )}

        {/* אזור ריק למרחב גלילה נעים */}
        <div className="gt-task-sheet__spacer" />

        {/* כפתורי כוכב/בוצע בסיסיים (אופציונלי להרחיב) */}
        <div className="gt-task-sheet__actions-inline">
          <button
            className={"gt-inline-btn gt-star-btn" + (task.starred ? " is-on" : "")}
            aria-label={task.starred ? "ביטול מועדף" : "סמן כמועדף"}
            onClick={() => onToggleStar?.(task.id)}
            type="button"
          >★</button>
          <button
            className={"gt-inline-btn gt-complete-btn" + (isCompleted ? " is-on" : "")}
            aria-label={isCompleted ? "סמן כלא בוצע" : "סמן כבוצע"}
            onClick={() => onToggleComplete?.(task.id)}
            type="button"
          >✓</button>
        </div>

        {/* פעולה תחתונה ראשית */}
        <div className="gt-task-sheet__footer">
          <button
            className="gt-primary"
            onClick={() => onToggleComplete?.(task.id)}
            ref={lastRef}
          >
            {isCompleted ? "סימון שהמשימה לא בוצעה" : "סימון שהמשימה בוצעה"}
          </button>
        </div>
      </aside>
      <DateTimeSheet
        open={dateOpen}
        initialDate={reminderDate || new Date()}
    onConfirm={async (d)=>{
          setDateOpen(false);
          if (!d) { // clear
            setReminderDate(null); setReminderTime(null);
            setDueDate?.(task.id, null);
      try { await cancelReminderForTask(task.id); } catch {}
            return;
          }
          // simplistic: use selected date and keep existing time or set +10m
            const base = new Date(d);
            if (!reminderTime) {
              const dt = new Date(Date.now() + 10*60000);
              const hh = String(dt.getHours()).padStart(2,'0');
              const mm = String(dt.getMinutes()).padStart(2,'0');
              setReminderTime(`${hh}:${mm}`);
            }
            setReminderDate(base);
            setDueDate?.(task.id, base);
            if (onFirstReminderAttempt) {
              try { await onFirstReminderAttempt(); } catch {/* ignore */}
            }
            try {
              const when = combineDateTime(base, reminderTime || `${String(base.getHours()).padStart(2,'0')}:${String(base.getMinutes()).padStart(2,'0')}`);
              await scheduleReminderIfPossible({ taskId: task.id, title: task.title, at: when });
            } catch {/* ignore schedule errors */}
        }}
        onClose={()=> setDateOpen(false)}
      />
    </>
  );
}
