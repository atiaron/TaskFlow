// Hook פשוט לניהול טוסט אחד בזמן + תור הודעות
import { useCallback, useState, useRef } from 'react';

/** שימוש:
 * const { toast, showToast, hideToast } = useToast();
 * showToast({ msg:'נעשה', undo: () => {...} });
 */
export function useToast() {
  const [toast, setToast] = useState({ open:false, msg:'', undo:null });
  const queueRef = useRef([]);
  const timerRef = useRef(null);

  const showNext = useCallback(() => {
    if (toast.open) return; // מחכים שייסגר
    const next = queueRef.current.shift();
    if (!next) return;
    setToast({ open:true, msg: next.msg, undo: next.undo || null, duration: next.duration || 3500 });
    // טיימר אוטומטי לסגירה
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setToast(t => ({ ...t, open:false }));
    }, next.duration || 3500);
  }, [toast.open]);

  const showToast = useCallback((opts) => {
    queueRef.current.push(opts);
    // אם אין פתוח – ננסה להציג עכשיו
    if (!toast.open) showNext();
  }, [toast.open, showNext]);

  const hideToast = useCallback(() => {
    clearTimeout(timerRef.current);
    setToast(t => ({ ...t, open:false }));
    // לאחר סגירה – ננסה להציג הבא (delay קצר כדי לא לבלוע אנימציה)
    setTimeout(() => showNext(), 120);
  }, [showNext]);

  // כשנסגר (transition CSS) – נציג הבא; נשתמש ב-onTransitionEnd ברכיב אם רוצים, כרגע timeout מספיק.

  return { toast, showToast, hideToast };
}

export default useToast;