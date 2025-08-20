import React, { memo } from 'react';
import clsx from 'clsx';

function TaskRow({ task, items = [], isCompleted, isStarred, onToggleComplete, onToggleStar, onOpenDetails, ariaLabel, urgency, isExpanded, onToggleExpand }) {
  const hasMeta = items.length > 0;
  const metaId = `meta-${task.id}`;
  return (
    <div className={`gt-row ${isCompleted ? ' is-completed' : ''} ${hasMeta ? 'has-sub' : 'no-sub'}`}
         role="listitem"
         aria-roledescription="משימה"
         data-task-id={task.id}
         aria-label={ariaLabel}
         data-state={isCompleted ? 'completed':'active'}>
      <div className="gt-rail">
        <button type="button" className={`gt-check${isCompleted ? ' is-on':''}`} aria-pressed={isCompleted} aria-label={isCompleted? 'בטל סימון כהושלמה':'סמן כהושלמה'} onClick={() => onToggleComplete?.(task.id)}>✓</button>
      </div>
      <div className="gt-body">
        <div className="gt-textArea" tabIndex={-1}>
          <button type="button" className="gt-textButton gt-text" onClick={() => onOpenDetails?.(task)}>
            <span className={`gt-title ${isStarred ? 'gt-title--primary':'gt-title--secondary'}`}>{(task.title || '').trim() || 'ללא כותרת'}{isCompleted && <span className="sr-only">בוצע</span>}</span>
            {hasMeta && (
              <span className="gt-meta" data-role="task-meta">
                <span id={metaId} className={clsx('gt-metaClamp', { 'is-expanded': isExpanded })}>
                  <span className="gt-timeCluster">
                    {items.map(it => (
                      <span key={it.key} className={`gt-badge gt-badge--${it.kind}`}>{it.label || it.text}</span>
                    ))}
                  </span>
                </span>
                <button type="button" className={clsx('gt-expander', { 'is-expanded': isExpanded })} aria-controls={metaId} aria-expanded={!!isExpanded} onClick={(e)=>{ e.stopPropagation(); onToggleExpand?.(); }}>▾</button>
              </span>
            )}
          </button>
        </div>
      </div>
      <div className="gt-trailing">
        <button type="button" className={`gt-star${isStarred ? ' is-on':''}`} aria-pressed={isStarred} aria-label={isStarred? 'בטל מועדפת':'סמן כמועדפת'} onClick={() => onToggleStar?.(task.id)}>★</button>
      </div>
    </div>
  );
}

function areEqual(prev, next){
  return prev.task === next.task
    && prev.isCompleted === next.isCompleted
    && prev.isStarred === next.isStarred
    && prev.isExpanded === next.isExpanded
    && prev.ariaLabel === next.ariaLabel
    && prev.items === next.items; // items reference memoized upstream
}

export default memo(TaskRow, areEqual);

