import React, { useEffect, useRef } from 'react';
import { useFocusTrap } from '../../a11y/useFocusTrap';
import { useSettings } from '../../context/SettingsContext';

const OPTIONS = [
  ['manual', 'הסדר שקבעת'],
  ['date', 'תאריך'],
  ['star', 'סומנו בכוכב לאחרונה'],
  ['title', 'כותרת']
];

export default function SortSheet() {
  const { isSortOpen: open, closeSort, sortMode, setSortMode } = useSettings();
  const sheetRef = useRef(null);
  useFocusTrap(sheetRef, { active: open, returnFocusTo: null });
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') closeSort(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeSort]);
  if (!open) return null;
  return (
    <>
      <div className="gt-overlay is-open" onClick={closeSort} />
      <div className="gt-sheet" role="dialog" aria-modal="true" aria-label="אפשרויות מיון" ref={sheetRef}>
        <div className="sheet-body">
          <h3>אפשרויות מיון</h3>
          {OPTIONS.map(([v, label]) => (
            <label key={v} className="sheet-row">
              <input type="radio" name="sort" checked={sortMode === v} onChange={() => setSortMode(v)} />
              <span>{label}</span>
            </label>
          ))}
          <button className="sheet-cancel" onClick={closeSort}>סיום</button>
        </div>
      </div>
    </>
  );
}
