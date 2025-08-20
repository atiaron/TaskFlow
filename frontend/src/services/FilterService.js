/**
 * FilterService - שירות מרכזי לניהול filtering וסינון
 * מפריד בין business logic של סינון לבין UI components
 */

// Filter types constants
export const FILTER_TYPES = {
  ALL: 'all',
  PENDING: 'pending', 
  COMPLETED: 'completed',
  TODAY: 'today',
  OVERDUE: 'overdue',
  STARRED: 'starred',
  HIGH_PRIORITY: 'high_priority'
};

// View modes constants
export const VIEW_MODES = {
  LIST: 'list',
  KANBAN: 'kanban',
  CALENDAR: 'calendar',
  FOCUS: 'focus'
};

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high'
};

// Categories
export const CATEGORIES = {
  PERSONAL: 'personal',
  WORK: 'work',
  SHOPPING: 'shopping',
  HEALTH: 'health',
  FINANCE: 'finance',
  EDUCATION: 'education',
  GENERAL: 'general'
};

export class FilterService {
  
  /**
   * Apply basic filter to tasks
   */
  static applyFilter(tasks, filterType) {
    const today = new Date().toISOString().slice(0, 10);
    
    switch (filterType) {
      case FILTER_TYPES.ALL:
        return tasks;
        
      case FILTER_TYPES.PENDING:
        return tasks.filter(task => !task.isCompleted);
        
      case FILTER_TYPES.COMPLETED:
        return tasks.filter(task => task.isCompleted);
        
      case FILTER_TYPES.TODAY:
        return tasks.filter(task => task.dueDate === today);
        
      case FILTER_TYPES.OVERDUE:
        return tasks.filter(task => 
          task.dueDate && task.dueDate < today && !task.isCompleted
        );
        
      case FILTER_TYPES.STARRED:
        return tasks.filter(task => task.isStarred);
        
      case FILTER_TYPES.HIGH_PRIORITY:
        return tasks.filter(task => task.priority === PRIORITY_LEVELS.HIGH);
        
      default:
        return tasks;
    }
  }

  /**
   * Apply priority filter
   */
  static applyPriorityFilter(tasks, priority) {
    if (priority === 'all') return tasks;
    return tasks.filter(task => task.priority === priority);
  }

  /**
   * Apply category filter
   */
  static applyCategoryFilter(tasks, category) {
    if (category === 'all') return tasks;
    return tasks.filter(task => task.category === category);
  }

  /**
   * Apply project filter
   */
  static applyProjectFilter(tasks, projectId) {
    if (!projectId || projectId === 'all') return tasks;
    return tasks.filter(task => task.projectId === projectId);
  }

  /**
   * Apply combined filters
   */
  static applyFilters(tasks, filters) {
    let filteredTasks = tasks;

    // Apply basic filter
    if (filters.type && filters.type !== FILTER_TYPES.ALL) {
      filteredTasks = this.applyFilter(filteredTasks, filters.type);
    }

    // Apply priority filter
    if (filters.priority && filters.priority !== 'all') {
      filteredTasks = this.applyPriorityFilter(filteredTasks, filters.priority);
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filteredTasks = this.applyCategoryFilter(filteredTasks, filters.category);
    }

    // Apply project filter
    if (filters.projectId && filters.projectId !== 'all') {
      filteredTasks = this.applyProjectFilter(filteredTasks, filters.projectId);
    }

    // Apply search query
    if (filters.search && filters.search.trim()) {
      const query = filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => {
        const t = (task.title || '').toLowerCase();
        const d = (task.description || '').toLowerCase();
        const tags = Array.isArray(task.tags) ? task.tags : [];
        return (
          t.includes(query) ||
          d.includes(query) ||
          tags.some(tag => (tag || '').toLowerCase().includes(query))
        );
      });
    }

    // Apply date range filter
    if (filters.dateFrom && filters.dateTo) {
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return false;
        return task.dueDate >= filters.dateFrom && task.dueDate <= filters.dateTo;
      });
    }

    return filteredTasks;
  }

  // Grouping helpers removed as UI no longer supports grouping-by in lists

  /**
   * Count tasks by different criteria
   */
  static getTaskCounts(tasks) {
    const today = new Date().toISOString().slice(0, 10);
    
    return {
      all: tasks.length,
      pending: tasks.filter(task => !task.isCompleted).length,
      completed: tasks.filter(task => task.isCompleted).length,
      today: tasks.filter(task => task.dueDate === today).length,
      overdue: tasks.filter(task => 
        task.dueDate && task.dueDate < today && !task.isCompleted
      ).length,
      starred: tasks.filter(task => task.isStarred).length,
      highPriority: tasks.filter(task => task.priority === PRIORITY_LEVELS.HIGH).length
    };
  }

  static getProjectTaskCounts(tasks, projects) {
    const counts = {};
    
    projects.forEach(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      counts[project.id] = {
        total: projectTasks.length,
        completed: projectTasks.filter(task => task.isCompleted).length,
        pending: projectTasks.filter(task => !task.isCompleted).length
      };
    });

    // Count unassigned tasks
    const unassignedTasks = tasks.filter(task => !task.projectId);
    counts.unassigned = {
      total: unassignedTasks.length,
      completed: unassignedTasks.filter(task => task.isCompleted).length,
      pending: unassignedTasks.filter(task => !task.isCompleted).length
    };

    return counts;
  }

  /**
   * Get filter options based on available tasks
   */
  static getAvailableFilters(tasks) {
    const priorities = [...new Set(tasks.map(task => task.priority))];
    const categories = [...new Set(tasks.map(task => task.category))];
    const projects = [...new Set(tasks.map(task => task.projectId).filter(Boolean))];
    
    return {
      priorities,
      categories, 
      projects
    };
  }

  /**
   * Create default filter state
   */
  static createDefaultFilters() {
    return {
      type: FILTER_TYPES.ALL,
      priority: 'all',
      category: 'all', 
      projectId: 'all',
      search: '',
      dateFrom: null,
      dateTo: null
    };
  }

  /**
   * Validate filter configuration
   */
  static validateFilters(filters) {
    const validTypes = Object.values(FILTER_TYPES);
    const validPriorities = [...Object.values(PRIORITY_LEVELS), 'all'];
    const validCategories = [...Object.values(CATEGORIES), 'all'];

    return {
      isValid: (
        validTypes.includes(filters.type) &&
        validPriorities.includes(filters.priority) &&
        validCategories.includes(filters.category)
      ),
      errors: []
    };
  }
}
