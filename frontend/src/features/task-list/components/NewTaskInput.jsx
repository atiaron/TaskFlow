// src/features/task-list/components/NewTaskInput.jsx
import React from 'react';
import './new-task-input.css';

export default function NewTaskInput({
  open = false,
  autoFocus = false,
  onSubmit = () => true,
  onCancel = () => {},
}) {
  const [title, setTitle] = React.useState('');
  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const ok = await Promise.resolve(onSubmit(t));
    if (ok) setTitle('');
  };

  return (
    <form className="gt-new" onSubmit={handleSubmit}>
      <input
        className="gt-new-input"
        type="text"
        placeholder="הוספת משימה"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus={autoFocus}
        aria-label="הוספת משימה"
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onCancel(); } }}
      />
      <div className="gt-new-actions">
        <button type="button" className="gt-btn ghost" onClick={onCancel}>בטל</button>
        <button
          type="submit"
            className="gt-btn primary"
          disabled={!title.trim()}
          aria-label="שמור משימה"
          title="שמור"
        >
          ✓
        </button>
      </div>
    </form>
  );
}