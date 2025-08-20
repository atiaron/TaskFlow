// src/features/task-list/useTasks.js
import { useCallback, useEffect, useState } from 'react';
import { LocalStorageTaskRepository } from '../../data/TaskRepository';
import { deriveViewState } from '../../lib/loadStatus';
import { sortTasks } from '../../lib/sortTasks';

// Repository instance (could be injected later)
const repo = new LocalStorageTaskRepository();

/**
 * Contract:
 * const {
 *   tasks, addTask, updateTask, toggleComplete, toggleStar,
 *   clearCompleted, undoClear, lastCleared,
 *   status // loading|ready|error
 * } = useTasks();
 */

export function useTasks(){
  const [tasks, setTasks] = useState([]);
  const [viewState, setViewState] = useState(()=> deriveViewState('idle', 0));

  // initial load
  useEffect(()=>{
    let live = true;
    setViewState(deriveViewState('loading', 0));
    repo.list().then(list => {
      if (!live) return;
      setTasks(sortTasks(list));
      setViewState(deriveViewState('ready', list.length));
    }).catch(err => {
      if (!live) return;
      setViewState(deriveViewState('error', 0, String(err?.message||err)));
    });
    return () => { live = false; };
  }, []);

  const refresh = useCallback(()=>{
    setViewState(v => deriveViewState('loading', tasks.length));
    return repo.list().then(list => {
      setTasks(sortTasks(list));
      setViewState(deriveViewState('ready', list.length));
    }).catch(err => {
      setViewState(deriveViewState('error', 0, String(err?.message||err)));
    });
  }, [tasks.length]);

  // Add a task. Accepts either a string title or an object { title, ...rest }.
  const addTask = useCallback(async (input) => {
    const title = typeof input === 'string' ? input : (input && input.title);
    const trimmed = (title || '').trim();
    if (!trimmed) return null; // ignore empty
    const base = (typeof input === 'object' && input) ? input : {};
    const created = await repo.create({ ...base, title: trimmed });
    setTasks(prev => sortTasks([created, ...prev]));
    setViewState(v => deriveViewState('ready', tasks.length + 1));
    return created;
  }, [tasks.length]);

  const updateTask = useCallback(async (id, patch) => {
    const updated = await repo.update(id, patch || {});
    setTasks(prev => sortTasks(prev.map(t => t.id === id ? updated : t)));
    return updated;
  }, []);

  const toggleComplete = useCallback(async (id) => {
    const curr = tasks.find(t => t.id === id);
    if (!curr) return;
    const updated = await repo.update(id, curr.isCompleted || curr.completed ? { isCompleted:false, completedAt:null, completed:false } : { isCompleted:true, completed:true, completedAt:new Date().toISOString() });
    setTasks(prev => sortTasks(prev.map(t => t.id === id ? updated : t)));
  }, [tasks]);

  const toggleStar = useCallback(async (id) => {
    const curr = tasks.find(t => t.id === id);
    if (!curr) return;
    const updated = await repo.update(id, { isStarred: !curr.isStarred && !curr.starred ? true : !curr.isStarred ? !curr.starred : !curr.isStarred, starred: !(curr.starred || curr.isStarred) });
    setTasks(prev => sortTasks(prev.map(t => t.id === id ? updated : t)));
  }, [tasks]);

  const removeTask = useCallback(async (id) => {
    await repo.remove(id);
    setTasks(prev => prev.filter(t => t.id !== id));
    setViewState(v => deriveViewState('ready', Math.max(0, tasks.length - 1)));
  }, [tasks.length]);

  // Clear all completed tasks (pure; returns cleared list for external undo service)
  const clearCompleted = useCallback(async () => {
    const cleared = tasks.filter(t => t.completed || t.isCompleted || t.completedAt);
    if (!cleared.length) return { cleared };
    const remaining = tasks.filter(t => !(t.completed || t.isCompleted || t.completedAt));
    setTasks(remaining);
    setViewState(deriveViewState('ready', remaining.length));
    return { cleared };
  }, [tasks]);

  const isEmptyFiltered = useCallback((visibleCount) => viewState.status === 'ready' && visibleCount === 0, [viewState.status]);

  return { tasks, status:viewState, addTask, updateTask, toggleComplete, toggleStar, removeTask, refresh, isEmptyFiltered, clearCompleted };
}
