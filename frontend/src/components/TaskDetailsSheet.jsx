import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '../a11y/useFocusTrap';

// Utility combine date+time strings to timestamp
function combineDateTime(dateStr, timeStr) {
  if (!dateStr) return undefined;
  try {
    const [y,m,d] = dateStr.split('-').map(Number);
    let hours = 0, minutes = 0;
    if (timeStr) { [hours, minutes] = timeStr.split(':').map(Number); }
    const dt = new Date(y, m-1, d, hours, minutes, 0, 0);
    return dt.getTime();
  } catch { return undefined; }
}

export default function TaskDetailsSheet({
  isOpen,
  task,
  onClose,
  onUpdate,
  onToggleStar,
  onToggleComplete,
  initialFocusRef
}) {
  const sheetRef = useRef(null);
  const firstFieldRef = useRef(null);
  const lastActiveTrigger = useRef(initialFocusRef?.current || null);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Sync when task changes
  useEffect(() => {
    if (task) {
      setNotes(task.notes || '');
      if (task.reminderAt) {
        const dt = new Date(task.reminderAt);
        if (!isNaN(dt)) {
          const ds = dt.toISOString().slice(0,10);
          const ts = dt.toTimeString().slice(0,5);
          setDate(ds); setTime(ts);
        }
      } else { setDate(''); setTime(''); }
    }
  }, [task]);

  // Focus trap & initial focus
  useFocusTrap(sheetRef, { active: isOpen, initialFocus: null, returnFocusTo: lastActiveTrigger.current });
  useEffect(() => { if (isOpen) setTimeout(() => firstFieldRef.current?.focus(), 0); }, [isOpen]);

  const handleClose = useCallback(() => {
    onClose?.();
    setShowNotes(false);
    // restore focus
    setTimeout(() => { lastActiveTrigger.current?.focus?.(); }, 0);
  }, [onClose]);

  if (!isOpen || !task) return null;
  const completedSub = task.completed ? `בוצעה: ${new Date(task.updatedAt).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'long' })}` : '';

  const applyReminder = (d, t) => {
    const ts = combineDateTime(d, t);
    if (ts) onUpdate(task.id, { reminderAt: ts });
  };

  return (
    <>
      <div className="gt-overlay is-open" onClick={handleClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className="gt-sheet gt-details is-open"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gt-details-title"
      >
        <div className="gt-sheet__handle" />
        <header className="gt-details-header">
          <h3 id="gt-details-title" className="gt-details-title">{task.title}</h3>
          {completedSub && <div className="gt-details-subtext" aria-live="polite">{completedSub}</div>}
          <div className="gt-details-actions-row">
            <button type="button" onClick={() => onToggleStar(task.id)} aria-pressed={task.starred} className={"gt-star-btn" + (task.starred ? ' is-on':'')}>★</button>
            <button type="button" onClick={() => onToggleComplete(task.id)} aria-pressed={task.completed} className={"gt-complete-btn" + (task.completed ? ' is-on':'')}>{task.completed ? '✓' : '✓'}</button>
          </div>
        </header>
        <div className="gt-details-body">
          <div className="gt-details-section">
            {!showNotes && (
              <button ref={firstFieldRef} type="button" className="gt-details-inline-btn" onClick={() => setShowNotes(true)}>הוספת פרטים</button>
            )}
            {showNotes && (
              <div className="gt-notes-wrap">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  onBlur={() => onUpdate(task.id, { notes })}
                  placeholder="הוסף פרטים" rows={3}
                />
                <div className="gt-notes-actions">
                  <button type="button" onClick={() => { onUpdate(task.id, { notes }); handleClose(); }}>שמירה וסגירה</button>
                  <button type="button" onClick={() => setShowNotes(false)}>ביטול</button>
                </div>
              </div>
            )}
          </div>
          <div className="gt-details-section">
            <div className="gt-inline-datetime">
              <label>תאריך
                <input type="date" value={date} onChange={e => { setDate(e.target.value); applyReminder(e.target.value, time); }} />
              </label>
              <label>שעה
                <input type="time" value={time} onChange={e => { setTime(e.target.value); applyReminder(date, e.target.value); }} />
              </label>
            </div>
          </div>
        </div>
        <footer className="gt-details-footer">
          <button type="button" onClick={handleClose}>ביטול</button>
        </footer>
      </div>
    </>
  );
}
