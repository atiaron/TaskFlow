/**
 * TaskFlow - Task Helpers Tests
 * Test suite for task utility functions and compatibility
 */

import { 
  getTaskDueDate, 
  getTaskCreatedAt, 
  getTaskUpdatedAt, 
  isTaskCompleted, 
  normalizeTask,
  isTaskOverdue,
  getTaskCompletionTime
} from '../utils/taskHelpers';
import { Task } from '../types/index';

describe('TaskHelpers', () => {
  const mockTask: Task = {
    id: 'test-task-1',
    userId: 'user-123',
    title: 'Test Task',
    description: 'A test task',
    status: 'pending',
    priority: 'medium',
    due_date: new Date('2025-08-10'),
    created_at: new Date('2025-08-05'),
    updated_at: new Date('2025-08-06'),
    created_by_ai: false,
    category: 'work',
    tags: ['test', 'development']
  };

  describe('getTaskDueDate', () => {
    test('should return due_date when available', () => {
      const result = getTaskDueDate(mockTask);
      expect(result).toEqual(new Date('2025-08-10'));
    });

    test('should return dueDate when available', () => {
      const taskWithCamelCase = { ...mockTask, dueDate: new Date('2025-08-15') };
      const result = getTaskDueDate(taskWithCamelCase);
      expect(result).toEqual(new Date('2025-08-15'));
    });

    test('should return undefined when no due date', () => {
      const taskWithoutDue = { ...mockTask, due_date: undefined };
      const result = getTaskDueDate(taskWithoutDue);
      expect(result).toBeUndefined();
    });
  });

  describe('isTaskCompleted', () => {
    test('should return true for completed status', () => {
      const completedTask = { ...mockTask, status: 'completed' as const };
      expect(isTaskCompleted(completedTask)).toBe(true);
    });

    test('should return true for completed property', () => {
      const completedTask = { ...mockTask, completed: true };
      expect(isTaskCompleted(completedTask)).toBe(true);
    });

    test('should return false for pending status', () => {
      expect(isTaskCompleted(mockTask)).toBe(false);
    });
  });

  describe('normalizeTask', () => {
    test('should add camelCase properties', () => {
      const normalized = normalizeTask(mockTask);
      
      expect(normalized.dueDate).toEqual(mockTask.due_date);
      expect(normalized.createdAt).toEqual(mockTask.created_at);
      expect(normalized.updatedAt).toEqual(mockTask.updated_at);
      expect(normalized.completed).toBe(false);
    });
  });

  describe('isTaskOverdue', () => {
    test('should return true for overdue incomplete tasks', () => {
      const overdueTask = {
        ...mockTask,
        due_date: new Date('2020-01-01'), // Past date
        status: 'pending' as const
      };
      expect(isTaskOverdue(overdueTask)).toBe(true);
    });

    test('should return false for completed tasks', () => {
      const completedOverdueTask = {
        ...mockTask,
        due_date: new Date('2020-01-01'),
        status: 'completed' as const
      };
      expect(isTaskOverdue(completedOverdueTask)).toBe(false);
    });

    test('should return false for tasks without due date', () => {
      const taskWithoutDue = { ...mockTask, due_date: undefined };
      expect(isTaskOverdue(taskWithoutDue)).toBe(false);
    });
  });

  describe('getTaskCompletionTime', () => {
    test('should return completion time in hours for completed tasks', () => {
      const completedTask = {
        ...mockTask,
        status: 'completed' as const,
        created_at: new Date('2025-08-05T10:00:00'),
        updated_at: new Date('2025-08-05T15:00:00') // 5 hours later
      };
      
      const result = getTaskCompletionTime(completedTask);
      expect(result).toBe(5);
    });

    test('should return null for incomplete tasks', () => {
      const result = getTaskCompletionTime(mockTask);
      expect(result).toBeNull();
    });
  });
});