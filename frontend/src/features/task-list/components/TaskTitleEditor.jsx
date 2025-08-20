// Inline title editor with accessible behaviors
import React, { useState, useEffect, useRef } from 'react';

export default function TaskTitleEditor({ initialValue, onSave, onCancel }) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef(null);

  useEffect(() => { if (ref.current) ref.current.focus(); }, []);

  const handleSave = () => {
    const v = value.trim();
    if (!v) { onCancel(); return; }
    if (v !== initialValue) onSave(v); else onCancel();
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSave(); }}
      className="task-title-editor"
    >
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); onCancel(); } }}
        onBlur={handleSave}
        aria-label="עריכת כותרת משימה"
        className="task-title-input"
        maxLength={200}
      />
    </form>
  );
}
