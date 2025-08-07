/**
 * Task Helper Utilities
 * Provides compatibility functions for Task properties to handle both snake_case and camelCase
 */

import { Task } from '../types/index';

/**
 * Get due date from task, handling both naming conventions
 */
export function getTaskDueDate(task: Task): Date | undefined {
  return task.dueDate || task.due_date;
}

/**
 * Get created date from task, handling both naming conventions
 */
export function getTaskCreatedAt(task: Task): Date {
  return task.createdAt || task.created_at;
}

/**
 * Get updated date from task, handling both naming conventions
 */
export function getTaskUpdatedAt(task: Task): Date {
  return task.updatedAt || task.updated_at;
}

/**
 * Check if task is completed based on status
 */
export function isTaskCompleted(task: Task): boolean {
  return task.completed === true || task.status === 'completed';
}

/**
 * Normalize task to include both naming conventions
 */
export function normalizeTask(task: Task): Task {
  return {
    ...task,
    dueDate: task.dueDate || task.due_date,
    createdAt: task.createdAt || task.created_at,
    updatedAt: task.updatedAt || task.updated_at,
    completed: task.completed !== undefined ? task.completed : task.status === 'completed'
  };
}

/**
 * Check if task is overdue
 */
export function isTaskOverdue(task: Task): boolean {
  const dueDate = getTaskDueDate(task);
  if (!dueDate) return false;
  return new Date(dueDate) < new Date() && !isTaskCompleted(task);
}

/**
 * Get task completion percentage for analytics
 */
export function getTaskCompletionTime(task: Task): number | null {
  if (!isTaskCompleted(task)) return null;
  
  const created = getTaskCreatedAt(task);
  const updated = getTaskUpdatedAt(task);
  
  return Math.round((updated.getTime() - created.getTime()) / (1000 * 60 * 60)); // hours
}