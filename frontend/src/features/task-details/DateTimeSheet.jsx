import React, {useEffect, useMemo, useRef, useState} from 'react';

/** DateTimeSheet – בורר תאריך (ועתידית גם שעה) בסגנון Google Tasks */
export default function DateTimeSheet({
  open,
  initialDate,            // Date | null
  onConfirm,              // (date: Date) => void
  onClose,                // () => void
}) {
  const wrapRef = useRef(null);
  const firstFocusable = useRef(null);
  const lastFocusable = useRef(null);
  const [selected, setSelected] = useState(() => initialDate || new Date());
  const [viewYM, setViewYM]   = useState(() => {
    const d = initialDate || new Date();
    return { y: d.getFullYear(), m: d.getMonth() }; // 0..11
  });

  // נעילת גלילה והחזרת פוקוס
  useEffect(() => {
    const root = document.querySelector('.google-tasks-wrapper');
    if (!root) return;
    if (open) root.classList.add('is-datetime-open');
    else root.classList.remove('is-datetime-open');
    return () => root.classList.remove('is-datetime-open');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    // פוקוס לכפתור הראשון
    setTimeout(() => firstFocusable.current?.focus(), 0);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        const f = firstFocusable.current, l = lastFocusable.current;
        if (!f || !l) return;
        if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
        if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open, onClose]);

  const monthTitle = useMemo(() => {
    const months = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
    return `${months[viewYM.m]} ${viewYM.y}`;
  }, [viewYM]);

  const matrix = useMemo(() => {
    // החזרת מטריצה של תאריכים להצגה – שבוע ראשון מתחיל ביום א' (0)
    const first = new Date(viewYM.y, viewYM.m, 1);
    const startDow = (first.getDay() + 6) % 7; // להפוך ל-א'=0, ... ש'=6
    const daysInMonth = new Date(viewYM.y, viewYM.m + 1, 0).getDate();
    const prevMonthDays = new Date(viewYM.y, viewYM.m, 0).getDate();
    const list = [];
    for (let i = 0; i < 42; i++) {
      const cellIndex = i - startDow + 1;
      let y = viewYM.y, m = viewYM.m, d = cellIndex;
      let out = false;
      if (cellIndex <= 0) { // מהחודש הקודם
        m = viewYM.m - 1; if (m < 0) { m = 11; y -= 1; }
        d = prevMonthDays + cellIndex; out = true;
      } else if (cellIndex > daysInMonth) { // מהחודש הבא
        m = viewYM.m + 1; if (m > 11) { m = 0; y += 1; }
        d = cellIndex - daysInMonth; out = true;
      }
      list.push({ y, m, d, out, ts: +new Date(y, m, d) });
    }
    return list;
  }, [viewYM]);

  const todayTS = +new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const selTS   = +new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());

  const setMonth = (delta) => {
    let y = viewYM.y, m = viewYM.m + delta;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0;  y += 1; }
    setViewYM({ y, m });
  };

  if (!open) return null;

  return (
    <>
      <div className="gt-datetime-overlay is-open" onClick={onClose} />
      <aside className="gt-datetime is-open" role="dialog" aria-modal="true" aria-label="בחירת תאריך ושעה" ref={wrapRef}>
        {/* Header */}
        <div className="gt-date-header">
          <button className="gt-nav" ref={firstFocusable} aria-label="חודש קודם" onClick={() => setMonth(-1)}>❮</button>
          <div className="gt-title">{monthTitle}</div>
          <button className="gt-nav" aria-label="חודש הבא" onClick={() => setMonth(1)}>❯</button>
        </div>

        {/* Grid */}
        <div className="gt-date-grid">
          <div className="gt-dow">
            <div>א׳</div><div>ב׳</div><div>ג׳</div><div>ד׳</div><div>ה׳</div><div>ו׳</div><div>ש׳</div>
          </div>
          <div className="gt-days">
            {matrix.map((c, i) => {
              const isToday = c.ts === todayTS;
              const isSel   = c.ts === selTS;
              return (
                <button
                  key={i}
                  className={`gt-day${c.out ? ' is-out':''}${isToday ? ' is-today':''}${isSel ? ' is-selected':''}`}
                  onClick={() => setSelected(new Date(c.y, c.m, c.d))}
                  aria-pressed={isSel}
                  aria-label={`${c.d} בחודש ${c.m+1} שנת ${c.y}`}
                >{c.d}</button>
              );
            })}
          </div>
        </div>

        {/* Rows: time + back */}
        <div className="gt-date-rows">
          <div className="gt-row-link" onClick={()=>{
            // פיקר שעה מינימלי (native) – נשמור אותה על ה- Date הנבחר
            const cur = selected;
            const hh = String(cur.getHours()).padStart(2,'0');
            const mm = String(cur.getMinutes()).padStart(2,'0');
            const t  = window.prompt('שעה (HH:MM)', `${hh}:${mm}`);
            if (!t) return;
            const [h,m] = t.split(':').map(n=>parseInt(n,10));
            if (Number.isFinite(h) && Number.isFinite(m)) {
              const nd = new Date(cur); nd.setHours(h); nd.setMinutes(m); setSelected(nd);
            }
          }}>
            <span className="ico">🕒</span> בחירת שעה
          </div>
          <div className="gt-row-link" onClick={onClose}>
            <span className="ico">↩</span> חזרה
          </div>
        </div>

        {/* Note */}
        <div className="gt-date-note">
          כדי לקבל תזכורות בזמן, צריך לתת ל-Tasks הרשאה ליצור התראות ותזכורות בהגדרות. <a href="#settings">להגדרות</a>
        </div>

        {/* Footer */}
        <div className="gt-date-footer">
          <button className="gt-btn-link" onClick={() => onConfirm?.(selected)}>סיים</button>
          <button className="gt-btn-link" onClick={onClose} ref={lastFocusable}>ביטול</button>
        </div>
      </aside>
    </>
  );
}
