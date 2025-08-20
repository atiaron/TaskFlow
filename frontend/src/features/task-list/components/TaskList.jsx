import React, { useCallback, useEffect } from "react";
import TaskRowContainer from "./TaskRowContainer";
import { useSettings } from '../../../context/SettingsContext';
// Using unified modern Task Row V2
import TaskRowV2 from '../../../components/TaskRowV2';
import { isModernTask, getModernTasksMode } from '../../../featureFlags/modernTasks';


export default function TaskList({ enrichedVisible = [], enrichedCompleted = [], isCompletedRoute = false, actions, title = 'המשימות שלי' }) {
  const { openSort, openListMenu } = useSettings();
  const mode = getModernTasksMode();
  useEffect(()=> {
    // lightweight telemetry
    // eslint-disable-next-line no-console
    console.info('[modern-task-row] rollout mode:', mode);
  }, [mode]);
  const handleOpenSort = useCallback(() => openSort(), [openSort]);
  const handleOpenListMenu = useCallback(() => openListMenu(), [openListMenu]);
  return (
    <div className="gt-list-card" role="region" aria-label={title}>
      <div className="gt-list-header">
        <h2 className="gt-list-title">{title}</h2>
        <div className="gt-list-actions">
          <button className="gt-icon sort-arrows" aria-label="מיון" type="button" onClick={handleOpenSort} />
          <button className="gt-icon menu-dots" aria-label="תפריט רשימה" type="button" onClick={handleOpenListMenu} />
        </div>
      </div>
      <div role="list" className="gt-list-body">
        {isCompletedRoute
          ? enrichedCompleted.map(e => isModernTask(e.task.id)
              ? (
                  <TaskRowV2
                    key={e.task.id}
                    task={{
                      id: e.task.id,
                      title: e.task.title,
                      completed: !!(e.task.completed || e.task.isCompleted || e.task.completedAt),
                      starred: !!(e.task.starred || e.task.isStarred),
                      priority: e.task.priority || 'p3',
                      meta: e.meta?.summary || e.meta?.text || '',
                      badges: (e.meta?.items || []).map(it => ({ id: it.key || it.label || it.text, label: it.label || it.text }))
                    }}
                    onToggleComplete={actions.toggleComplete}
                    onToggleStar={actions.toggleStar}
                    onDelete={actions.deleteTask}
                    onOpenDetails={actions.openDetails}
                  />
                )
              : (
                  <TaskRowContainer key={e.task.id} task={e.task} meta={e.meta} actions={actions} />
                )
            )
          : enrichedVisible.map(e => isModernTask(e.task.id)
              ? (
                  <TaskRowV2
                    key={e.task.id}
                    task={{
                      id: e.task.id,
                      title: e.task.title,
                      completed: !!(e.task.completed || e.task.isCompleted || e.task.completedAt),
                      starred: !!(e.task.starred || e.task.isStarred),
                      priority: e.task.priority || 'p3',
                      meta: e.meta?.summary || e.meta?.text || '',
                      badges: (e.meta?.items || []).map(it => ({ id: it.key || it.label || it.text, label: it.label || it.text }))
                    }}
                    onToggleComplete={actions.toggleComplete}
                    onToggleStar={actions.toggleStar}
                    onDelete={actions.deleteTask}
                    onOpenDetails={actions.openDetails}
                  />
                )
              : (
                  <TaskRowContainer key={e.task.id} task={e.task} meta={e.meta} actions={actions} />
                )
            )}
      </div>
    </div>
  );
}