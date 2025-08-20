import React from 'react';
import { useTasks } from '../features/task-list/useTasks';

/**
 * GlobalSearchOverlay
 * Command-palette style global search (MVP).
 * Props: open, onClose
 */
export default function GlobalSearchOverlay({ open, onClose }){
  const { tasks } = useTasks();
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if(open){
      setTimeout(() => { inputRef.current?.focus(); }, 10);
      const onKey = (e) => {
        if(e.key === 'Escape'){ e.stopPropagation(); onClose?.(); }
      };
      window.addEventListener('keydown', onKey, { capture:true });
      return () => window.removeEventListener('keydown', onKey, { capture:true });
    }
  }, [open, onClose]);

  if(!open) return null;

  const lower = query.toLowerCase();
  const results = !query ? [] : tasks.filter(t => (t.title||'').toLowerCase().includes(lower)).slice(0,25);

  function handleBackdrop(e){
    if(e.target === e.currentTarget) onClose?.();
  }

  return (
    <div className="gt-searchOverlay" role="dialog" aria-modal="true" aria-label="חיפוש" onMouseDown={handleBackdrop}>
      <div className="gt-searchOverlay__panel">
        <input
          ref={inputRef}
          className="gt-searchOverlay__input"
          placeholder="חיפוש משימות..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="שדה חיפוש גלובלי"
          dir="rtl"
        />
        <div className="gt-searchOverlay__results" role="listbox">
          {query && results.length === 0 && (
            <div className="gt-searchOverlay__empty" role="status">אין תוצאות</div>
          )}
          {results.map(r => (
            <div key={r.id} className="gt-searchOverlay__item" role="option">
              <span className="gt-searchOverlay__itemTitle">{r.title}</span>
            </div>
          ))}
        </div>
        <div className="gt-searchOverlay__hint">Esc לסגירה • Enter עתידי לפתיחה</div>
      </div>
    </div>
  );
}
