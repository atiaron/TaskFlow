/**
 * TaskService - שירות מרכזי לניהול משימות
 * מפריד בין business logic לבין UI components
 */

export class TaskService {
  
  /**
   * Toggle task completion status
   */
  static toggleTask(tasks, taskId) {
    return tasks.map(task => 
      task.id === taskId 
        ? {
            ...task,
            isCompleted: !task.isCompleted,
            progress: !task.isCompleted ? 100 : 0,
            completedAt: !task.isCompleted ? new Date().toISOString() : null
          }
        : task
    );
  }

  /**
   * Toggle task star status
   */
  static toggleStar(tasks, taskId) {
    return tasks.map(task => 
      task.id === taskId ? { ...task, isStarred: !task.isStarred } : task
    );
  }

  /**
   * Update task title
   */
  static updateTitle(tasks, { id, title }) {
    return tasks.map(task => 
      task.id === id ? { ...task, title: title.trim() } : task
    );
  }

  /**
   * Add subtask to existing task
   */
  static addSubtask(tasks, taskId, subtaskTitle = 'משימת משנה חדשה') {
    const newSubtask = {
      id: Date.now(),
      title: subtaskTitle,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    return tasks.map(task => 
      task.id === taskId 
        ? {
            ...task,
            subtasks: [...(task.subtasks || []), newSubtask]
          }
        : task
    );
  }

  /**
   * Delete task
   */
  static deleteTask(tasks, taskId) {
    return tasks.filter(task => task.id !== taskId);
  }

  /**
   * Postpone task by specified days (default: 1 day)
   */
  static postponeTask(tasks, taskId, days = 1) {
    return tasks.map(task => {
      if (task.id !== taskId) return task;
      
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + days);
      
      return {
        ...task,
        dueDate: newDate.toISOString().slice(0, 10)
      };
    });
  }

  /**
   * Toggle subtask completion
   */
  static toggleSubtask(tasks, { taskId, subtaskId }) {
    return tasks.map(task => {
      if (task.id !== taskId) return task;
      
      const updatedSubtasks = (task.subtasks || []).map(subtask =>
        subtask.id === subtaskId 
          ? { ...subtask, isCompleted: !subtask.isCompleted }
          : subtask
      );

      // Calculate progress based on completed subtasks
      const completedCount = updatedSubtasks.filter(s => s.isCompleted).length;
      const progress = updatedSubtasks.length > 0 
        ? Math.round((completedCount / updatedSubtasks.length) * 100)
        : task.progress || 0;

      return {
        ...task,
        subtasks: updatedSubtasks,
        progress,
        isCompleted: progress === 100
      };
    });
  }

  /**
   * Create new task
   */
  static createTask(tasks, taskData) {
    const newTask = {
      id: Date.now(),
      title: taskData.title || 'משימה חדשה',
      description: taskData.description || '',
      isCompleted: false,
      isStarred: false,
      progress: 0,
      priority: taskData.priority || 'medium',
      category: taskData.category || 'general',
      dueDate: taskData.dueDate || null,
      tags: taskData.tags || [],
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...taskData
    };

    return [...tasks, newTask];
  }

  /**
   * Update existing task
   */
  static updateTask(tasks, taskId, updates) {
    return tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            ...updates,
            updatedAt: new Date().toISOString()
          }
        : task
    );
  }

  /**
   * Bulk operations for multiple tasks
   */
  static bulkComplete(tasks, taskIds) {
    return tasks.map(task =>
      taskIds.includes(task.id)
        ? { ...task, isCompleted: true, progress: 100 }
        : task
    );
  }

  static bulkDelete(tasks, taskIds) {
    return tasks.filter(task => !taskIds.includes(task.id));
  }

  static bulkUpdatePriority(tasks, taskIds, priority) {
    return tasks.map(task =>
      taskIds.includes(task.id)
        ? { ...task, priority }
        : task
    );
  }

  /**
   * Search and sort utilities
   */
  static searchTasks(tasks, query) {
    if (!query.trim()) return tasks;
    
    const searchTerm = query.toLowerCase();
    return tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm) ||
      task.description.toLowerCase().includes(searchTerm) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }

  static sortTasks(tasks, sortBy = 'created_at', direction = 'desc') {
    const sortedTasks = [...tasks];
    
    sortedTasks.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority] || 1;
          bValue = priorityOrder[b.priority] || 1;
          break;
        case 'due_date':
          aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
          bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
          break;
        case 'created_at':
        default:
          aValue = new Date(a.createdAt || a.id);
          bValue = new Date(b.createdAt || b.id);
          break;
      }
      
      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return sortedTasks;
  }

  /**
   * Statistics and analytics
   */
  static getTaskStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    const pending = total - completed;
    const starred = tasks.filter(t => t.isStarred).length;
    const overdue = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && !t.isCompleted
    ).length;

    return {
      total,
      completed,
      pending,
      starred,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  /**
   * Get tasks due today
   */
  static getTasksDueToday(tasks) {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter(task => 
      task.dueDate === today && !task.isCompleted
    );
  }

  /**
   * Get overdue tasks
   */
  static getOverdueTasks(tasks) {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter(task => 
      task.dueDate && task.dueDate < today && !task.isCompleted
    );
  }
}
