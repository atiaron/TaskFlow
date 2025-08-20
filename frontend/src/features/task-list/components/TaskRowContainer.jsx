import React, { useState, memo } from 'react';
import TaskRow from './TaskRow';
import { buildRowAria } from '../../../lib/a11y';
import { useTaskRowInteractions } from '../../../lib/useTaskRowInteractions';

// Expecting enriched meta passed in OR fallback to task.meta
function TaskRowContainer({ task, meta, actions }) {
  const [expanded, setExpanded] = useState(false);
  const items = meta?.items || meta?.meta?.items || [];
  const isCompleted = !!(task.completed || task.isCompleted || task.completedAt);
  const isStarred = !!(task.starred || task.isStarred);
  const ariaLabel = buildRowAria(task, { items: items || [] });
  const { onStar, onComplete, onOpen } = useTaskRowInteractions(task, actions);
  return (
    <TaskRow
      task={task}
      items={items || []}
      isCompleted={isCompleted}
      isStarred={isStarred}
      ariaLabel={ariaLabel}
      onToggleComplete={onComplete}
      onToggleStar={onStar}
      onOpenDetails={onOpen}
      isExpanded={expanded}
      onToggleExpand={() => setExpanded(v => !v)}
    />
  );
}

export default memo(TaskRowContainer);
