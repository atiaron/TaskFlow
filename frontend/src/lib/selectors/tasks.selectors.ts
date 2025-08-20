import { createSelector } from 'reselect';
import { sortTasks } from '../sortTasks';
import { loadViews } from '../views';
import { selectTaskMeta } from '../taskMeta';

// Basic input
export const selectAllTasks = (tasks: any[]) => tasks || [];
export const selectView = (_: any[], view: any) => view;

// If there's indexing logic elsewhere (taskIndex) it can be integrated; placeholder counts below.
export const selectCounts = createSelector([selectAllTasks], (tasks) => {
  let active = 0, completed = 0, starredActive = 0;
  for (const t of tasks) {
    const isCompleted = !!(t.isCompleted || t.completed || t.completedAt);
    if (isCompleted) completed++; else active++;
    if (!isCompleted && (t.isStarred || t.starred)) starredActive++;
  }
  return { total: tasks.length, active, completed, starredActive };
});

// Visible for current view (simplified: expecting view.rule.kind etc.)
export const selectVisible = createSelector([selectAllTasks, selectView], (tasks, view) => {
  // naive: filter by view kind; integrate full getTasksForView if present
  if (!view) return tasks;
  const kind = view?.rule?.kind || view.id;
  if (kind === 'completed') return tasks.filter(t => t.isCompleted || t.completed || t.completedAt);
  if (kind === 'starred') return tasks.filter(t => t.isStarred || t.starred);
  // custom lists could have view.rule.match? For now return all (improve later)
  return tasks;
});

export const selectVisibleSorted = createSelector([selectVisible], (tasks) => sortTasks(tasks));

export const selectVisibleEnriched = createSelector([selectVisibleSorted], (tasks) =>
  tasks.map(t => ({ task: t, meta: selectTaskMeta(t) }))
);

export const selectCompletedFromVisible = createSelector([selectVisibleSorted], (tasks) =>
  tasks.filter(t => t.isCompleted || t.completed || t.completedAt)
);
