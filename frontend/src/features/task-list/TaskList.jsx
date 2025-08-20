import React, { useMemo, useState } from 'react';
import TaskRow from './components/TaskRow';
import FAB from './components/FAB';
// רכיבים ישנים (NewTaskInput, SimpleEmptyState) הוסרו – הרשימה מנוהלת ישירות

export default function TaskList({
  tasks,
  onCreateTask,
  onToggleComplete,
  onToggleStar,
  onUpdateTask,
  onClearCompleted,
  isCreating,
  setIsCreating,
  editingTask,
  setEditingTask,
}) {
  // Simple local sortMode until global settings/context exists
  const [sortMode] = useState('star-first'); // future: accept prop / context
  const starSurfacesToTop = sortMode === 'star-first';
  const orderedTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    if (!starSurfacesToTop) return tasks;
    // Starred & not completed first, keep relative order (stable) using original index key
    return [...tasks].sort((a,b) => {
      const aKey = (a.starred && !a.completed) ? 0 : 1;
      const bKey = (b.starred && !b.completed) ? 0 : 1;
      if (aKey !== bKey) return aKey - bKey;
      // tie-breaker: preserve original order by creation/order field if present
      if (a.order && b.order) return b.order - a.order; // newer first like existing logic
      return 0;
    });
  }, [tasks, starSurfacesToTop]);
  const handleSubmit = (title) => {
    if (onCreateTask) onCreateTask(title);
    setIsCreating(false);
  };
  const handleCancel = () => setIsCreating(false);
  if (!orderedTasks || orderedTasks.length === 0) {
    return null; // Empty state מנוהל ע"י App.jsx
  }
  return (
    <div className="task-list-wrapper" dir="rtl">
      <div className="task-list-container">
    {orderedTasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            onToggleComplete={() => onToggleComplete(task.id)}
            onToggleStar={() => onToggleStar(task.id)}
            onUpdate={(updates) => onUpdateTask(task.id, updates)}
            onEdit={() => setEditingTask(task)}
      starSurfacesToTop={starSurfacesToTop}
          />
        ))}
      </div>
      {isCreating && (
        <div className="task-inline-creation">
            {/* רכיב יצירת משימה inline הוסר לטובת ComposerSheet */}
            <div className="composer-sheet">
              {/* ComposerSheet logic goes here */}
            </div>
        </div>
      )}
      <FAB onClick={() => setIsCreating(true)} />
      <div className="google-tasks-safe-area" />
    </div>
  );
}