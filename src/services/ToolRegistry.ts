/* Enhanced Tool Registry for TaskFlow */
import { Task, User, AIContext } from '../types';
import { StorageService } from './StorageService';

// Define tool interfaces
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute(params: any, context: ToolContext): Promise<ToolResult>;
}

export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
}

export interface ToolContext {
  userId: string;
  tasks: Task[];
  user?: User;
  timestamp: Date;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  message: string;
  type: 'create' | 'update' | 'delete' | 'search' | 'analyze' | 'plan';
}

// Individual Tool Classes
export class TaskManagementTool implements Tool {
  name = 'task_management';
  description = 'יצירה, עדכון ומחיקה של משימות';
  parameters: ToolParameter[] = [
    { name: 'action', type: 'string', description: 'סוג הפעולה: create/update/delete', required: true },
    { name: 'title', type: 'string', description: 'כותרת המשימה', required: false },
    { name: 'taskId', type: 'string', description: 'מזהה המשימה לעדכון/מחיקה', required: false },
    { name: 'description', type: 'string', description: 'תיאור המשימה', required: false },
    { name: 'priority', type: 'string', description: 'עדיפות: low/medium/high', required: false },
    { name: 'dueDate', type: 'string', description: 'תאריך יעד', required: false }
  ];

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    console.log('🛠️ TaskManagementTool executing:', params);
    
    try {
      switch (params.action) {
        case 'create':
          return await this.createTask(params, context);
        case 'update':
          return await this.updateTask(params, context);
        case 'delete':
          return await this.deleteTask(params, context);
        default:
          throw new Error(`פעולה לא ידועה: ${params.action}`);
      }
    } catch (error) {
      console.error('❌ TaskManagementTool error:', error);
      return {
        success: false,
        message: `שגיאה בביצוע הפעולה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`,
        type: 'create'
      };
    }
  }

  private async createTask(params: any, context: ToolContext): Promise<ToolResult> {
    if (!params.title) {
      throw new Error('כותרת המשימה נדרשת');
    }

    const newTask: Task = {
      title: params.title,
      description: params.description || '',
      completed: false,
      priority: params.priority || 'medium',
      dueDate: params.dueDate ? new Date(params.dueDate) : undefined,
      tags: params.tags || [],
      estimatedTime: params.estimatedTime || 30,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: context.userId
    };

    const savedTask = await StorageService.createTask(newTask);
    
    return {
      success: true,
      data: savedTask,
      message: `✅ המשימה "${params.title}" נוצרה בהצלחה`,
      type: 'create'
    };
  }

  private async updateTask(params: any, context: ToolContext): Promise<ToolResult> {
    if (!params.taskId) {
      throw new Error('מזהה המשימה נדרש לעדכון');
    }

    const updates: Partial<Task> = { user_id: context.userId };
    if (params.title) updates.title = params.title;
    if (params.description !== undefined) updates.description = params.description;
    if (params.priority) updates.priority = params.priority;
    if (params.dueDate) updates.dueDate = new Date(params.dueDate);
    if (params.completed !== undefined) updates.completed = params.completed;
    updates.updatedAt = new Date();

    const updatedTask = await StorageService.updateTaskById(params.taskId, updates);
    
    return {
      success: true,
      data: updatedTask,
      message: `✅ המשימה עודכנה בהצלחה`,
      type: 'update'
    };
  }

  private async deleteTask(params: any, context: ToolContext): Promise<ToolResult> {
    if (!params.taskId) {
      throw new Error('מזהה המשימה נדרש למחיקה');
    }

    await StorageService.deleteTask(params.taskId, context.userId);
    
    return {
      success: true,
      message: `🗑️ המשימה נמחקה בהצלחה`,
      type: 'delete'
    };
  }
}

export class SearchTool implements Tool {
  name = 'search';
  description = 'חיפוש משימות לפי מילות מפתח';
  parameters: ToolParameter[] = [
    { name: 'query', type: 'string', description: 'טקסט לחיפוש', required: true },
    { name: 'filters', type: 'object', description: 'פילטרים נוספים', required: false }
  ];

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    console.log('🔍 SearchTool executing:', params);
    
    try {
      const { query, filters = {} } = params;
      const allTasks = await StorageService.getAllTasks(context.userId);
      
      const filteredTasks = allTasks.filter(task => {
        // חיפוש טקסטואלי
        const textMatch = task.title.toLowerCase().includes(query.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(query.toLowerCase()));
        
        // פילטרים נוספים
        let filterMatch = true;
        if (filters.priority) {
          filterMatch = filterMatch && task.priority === filters.priority;
        }
        if (filters.completed !== undefined) {
          filterMatch = filterMatch && task.completed === filters.completed;
        }
        if (filters.dueDate) {
          const taskDate = task.dueDate ? new Date(task.dueDate).toDateString() : null;
          const filterDate = new Date(filters.dueDate).toDateString();
          filterMatch = filterMatch && taskDate === filterDate;
        }
        
        return textMatch && filterMatch;
      });
      
      return {
        success: true,
        data: filteredTasks,
        message: `🔍 נמצאו ${filteredTasks.length} משימות עבור "${query}"`,
        type: 'search'
      };
    } catch (error) {
      return {
        success: false,
        message: `שגיאה בחיפוש: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`,
        type: 'search'
      };
    }
  }
}

export class PlanningTool implements Tool {
  name = 'planning';
  description = 'תכנון יומי ושבועי של משימות';
  parameters: ToolParameter[] = [
    { name: 'type', type: 'string', description: 'סוג התכנון: daily/weekly', required: true },
    { name: 'date', type: 'string', description: 'תאריך התכנון', required: false },
    { name: 'preferences', type: 'object', description: 'העדפות תכנון', required: false }
  ];

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    console.log('📋 PlanningTool executing:', params);
    
    try {
      switch (params.type) {
        case 'daily':
          return await this.createDailyPlan(params, context);
        case 'weekly':
          return await this.createWeeklyPlan(params, context);
        default:
          throw new Error(`סוג תכנון לא ידוע: ${params.type}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `שגיאה בתכנון: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`,
        type: 'plan'
      };
    }
  }

  private async createDailyPlan(params: any, context: ToolContext): Promise<ToolResult> {
    const targetDate = params.date ? new Date(params.date) : new Date();
    const allTasks = await StorageService.getAllTasks(context.userId);
    
    // משימות לתאריך היעד
    const dailyTasks = allTasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === targetDate.toDateString() && !task.completed;
    });
    
    // משימות ללא תאריך יעד (מועמדות להיום)
    const floatingTasks = allTasks.filter(task => !task.dueDate && !task.completed)
      .sort((a, b) => (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0))
      .slice(0, 3); // עד 3 משימות צפות
    
    const plan = {
      date: targetDate,
      scheduledTasks: dailyTasks,
      suggestedTasks: floatingTasks,
      totalEstimatedTime: dailyTasks.reduce((sum, task) => sum + (task.estimatedTime || 30), 0),
      recommendations: this.generateDailyRecommendations(dailyTasks, floatingTasks)
    };
    
    return {
      success: true,
      data: plan,
      message: `📅 תוכנית יומית ל-${targetDate.toLocaleDateString('he-IL')} נוצרה`,
      type: 'plan'
    };
  }

  private async createWeeklyPlan(params: any, context: ToolContext): Promise<ToolResult> {
    const startDate = params.date ? new Date(params.date) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    
    const allTasks = await StorageService.getAllTasks(context.userId);
    
    // משימות השבוע
    const weeklyTasks = allTasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate >= startDate && taskDate <= endDate;
    });
    
    const plan = {
      startDate,
      endDate,
      weeklyTasks,
      dailyBreakdown: this.createDailyBreakdown(weeklyTasks, startDate),
      totalTasks: weeklyTasks.length,
      estimatedHours: weeklyTasks.reduce((sum, task) => sum + (task.estimatedTime || 30), 0) / 60,
      priorities: {
        high: weeklyTasks.filter(t => t.priority === 'high').length,
        medium: weeklyTasks.filter(t => t.priority === 'medium').length,
        low: weeklyTasks.filter(t => t.priority === 'low').length
      }
    };
    
    return {
      success: true,
      data: plan,
      message: `📅 תוכנית שבועית נוצרה עם ${weeklyTasks.length} משימות`,
      type: 'plan'
    };
  }

  private generateDailyRecommendations(scheduledTasks: Task[], suggestedTasks: Task[]): string[] {
    const recommendations: string[] = [];
    
    if (scheduledTasks.length === 0) {
      recommendations.push('💡 אין לך משימות מתוכננות להיום - זה זמן טוב להתקדם במשימות בהמתנה');
    }
    
    if (scheduledTasks.length > 5) {
      recommendations.push('⚠️ יש לך הרבה משימות להיום - כדאי לתעדף את החשובות ביותר');
    }
    
    const highPriorityTasks = scheduledTasks.filter(t => t.priority === 'high');
    if (highPriorityTasks.length > 0) {
      recommendations.push(`🎯 התמקד קודם ב-${highPriorityTasks.length} המשימות בעדיפות גבוהה`);
    }
    
    if (suggestedTasks.length > 0) {
      recommendations.push(`💡 אם יהיה לך זמן פנוי, כדאי להתקדם במשימות: ${suggestedTasks.slice(0, 2).map(t => t.title).join(', ')}`);
    }
    
    return recommendations;
  }

  private createDailyBreakdown(weeklyTasks: Task[], startDate: Date): any[] {
    const dailyBreakdown = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayTasks = weeklyTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === currentDate.toDateString();
      });
      
      dailyBreakdown.push({
        date: currentDate,
        dayName: currentDate.toLocaleDateString('he-IL', { weekday: 'long' }),
        tasks: dayTasks,
        taskCount: dayTasks.length,
        estimatedTime: dayTasks.reduce((sum, task) => sum + (task.estimatedTime || 30), 0)
      });
    }
    
    return dailyBreakdown;
  }
}

export class AnalyticsTool implements Tool {
  name = 'analytics';
  description = 'ניתוח פרודקטיביות ודפוסי עבודה';
  parameters: ToolParameter[] = [
    { name: 'type', type: 'string', description: 'סוג הניתוח: productivity/patterns/insights', required: true },
    { name: 'period', type: 'string', description: 'תקופת הניתוח: week/month/all', required: false, default: 'week' }
  ];

  async execute(params: any, context: ToolContext): Promise<ToolResult> {
    console.log('📊 AnalyticsTool executing:', params);
    
    try {
      switch (params.type) {
        case 'productivity':
          return await this.analyzeProductivity(params, context);
        case 'patterns':
          return await this.analyzePatterns(params, context);
        case 'insights':
          return await this.generateInsights(params, context);
        default:
          throw new Error(`סוג ניתוח לא ידוע: ${params.type}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `שגיאה בניתוח: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`,
        type: 'analyze'
      };
    }
  }

  private async analyzeProductivity(params: any, context: ToolContext): Promise<ToolResult> {
    const allTasks = await StorageService.getAllTasks(context.userId);
    const period = params.period || 'week';
    
    // חישוב תקופת הניתוח
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        startDate.setFullYear(2020); // תחילת זמן
        break;
    }
    
    // סינון משימות לתקופה
    const periodTasks = allTasks.filter(task => {
      const taskDate = new Date(task.updatedAt);
      return taskDate >= startDate && taskDate <= now;
    });
    
    const completedTasks = periodTasks.filter(task => task.completed);
    const pendingTasks = periodTasks.filter(task => !task.completed);
    
    const analytics = {
      period,
      totalTasks: periodTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      completionRate: periodTasks.length > 0 ? (completedTasks.length / periodTasks.length) * 100 : 0,
      averageTasksPerDay: this.calculateAverageTasksPerDay(periodTasks, startDate, now),
      priorityBreakdown: {
        high: periodTasks.filter(t => t.priority === 'high').length,
        medium: periodTasks.filter(t => t.priority === 'medium').length,
        low: periodTasks.filter(t => t.priority === 'low').length
      },
      estimatedTimeSpent: completedTasks.reduce((sum, task) => sum + (task.estimatedTime || 30), 0)
    };
    
    return {
      success: true,
      data: analytics,
      message: `📊 ניתוח פרודקטיביות ל${period === 'week' ? 'שבוע' : period === 'month' ? 'חודש' : 'כל הזמן'} הושלם`,
      type: 'analyze'
    };
  }

  private async analyzePatterns(params: any, context: ToolContext): Promise<ToolResult> {
    const allTasks = await StorageService.getAllTasks(context.userId);
    
    // ניתוח דפוסי יצירה
    const creationPatterns = this.analyzeCreationPatterns(allTasks);
    
    // ניתוח דפוסי השלמה
    const completionPatterns = this.analyzeCompletionPatterns(allTasks);
    
    // ניתוח קטגוריות/תגיות פופולריות
    const tagPatterns = this.analyzeTagPatterns(allTasks);
    
    const patterns = {
      creation: creationPatterns,
      completion: completionPatterns,
      tags: tagPatterns,
      mostProductiveTimeOfDay: this.findMostProductiveTime(allTasks),
      averageTaskDuration: this.calculateAverageTaskDuration(allTasks)
    };
    
    return {
      success: true,
      data: patterns,
      message: '🔍 ניתוח דפוסי עבודה הושלם',
      type: 'analyze'
    };
  }

  private async generateInsights(params: any, context: ToolContext): Promise<ToolResult> {
    const allTasks = await StorageService.getAllTasks(context.userId);
    const completedTasks = allTasks.filter(task => task.completed);
    const pendingTasks = allTasks.filter(task => !task.completed);
    
    const insights: string[] = [];
    
    // תובנות על יעילות
    const completionRate = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0;
    if (completionRate > 80) {
      insights.push('🎉 אתה מאוד יעיל! שיעור ההשלמה שלך מעל 80%');
    } else if (completionRate > 60) {
      insights.push('👍 יעילות טובה! אבל יש מקום לשיפור');
    } else {
      insights.push('💪 יש מקום לשיפור ביעילות - נסה לפרק משימות גדולות למשימות קטנות יותר');
    }
    
    // תובנות על עדיפויות
    const highPriorityTasks = allTasks.filter(t => t.priority === 'high');
    const highPriorityCompleted = highPriorityTasks.filter(t => t.completed);
    if (highPriorityTasks.length > 0) {
      const highPriorityRate = (highPriorityCompleted.length / highPriorityTasks.length) * 100;
      if (highPriorityRate > 70) {
        insights.push('🎯 מצוין! אתה מתמקד במשימות החשובות');
      } else {
        insights.push('⚠️ כדאי להתמקד יותר במשימות בעדיפות גבוהה');
      }
    }
    
    // תובנות על עומס עבודה
    if (pendingTasks.length > 20) {
      insights.push('📚 יש לך הרבה משימות פתוחות - כדאי לסגור כמה לפני שתוסיף חדשות');
    } else if (pendingTasks.length < 5) {
      insights.push('✨ נהדר! יש לך מעט משימות פתוחות - זה זמן טוב להוסיף משימות חדשות');
    }
    
    // תובנות על תכנון
    const overdueTasks = pendingTasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < new Date();
    });
    if (overdueTasks.length > 0) {
      insights.push(`⏰ יש לך ${overdueTasks.length} משימות שפג התוקף שלהן - כדאי לעדכן את התאריכים או לסגור אותן`);
    }
    
    return {
      success: true,
      data: { insights, totalInsights: insights.length },
      message: `💡 נוצרו ${insights.length} תובנות אישיות`,
      type: 'analyze'
    };
  }

  // Helper methods
  private calculateAverageTasksPerDay(tasks: Task[], startDate: Date, endDate: Date): number {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? tasks.length / days : 0;
  }

  private analyzeCreationPatterns(tasks: Task[]): any {
    const hourCounts: { [hour: number]: number } = {};
    const dayCounts: { [day: number]: number } = {};
    
    tasks.forEach(task => {
      const date = new Date(task.createdAt);
      const hour = date.getHours();
      const day = date.getDay();
      
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    return {
      mostActiveHour: this.findMostActiveKey(hourCounts),
      mostActiveDay: this.findMostActiveKey(dayCounts),
      hourlyDistribution: hourCounts,
      dailyDistribution: dayCounts
    };
  }

  private analyzeCompletionPatterns(tasks: Task[]): any {
    const completedTasks = tasks.filter(task => task.completed);
    
    const hourCounts: { [hour: number]: number } = {};
    const dayCounts: { [day: number]: number } = {};
    
    completedTasks.forEach(task => {
      const date = new Date(task.updatedAt);
      const hour = date.getHours();
      const day = date.getDay();
      
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    return {
      mostProductiveHour: this.findMostActiveKey(hourCounts),
      mostProductiveDay: this.findMostActiveKey(dayCounts),
      hourlyDistribution: hourCounts,
      dailyDistribution: dayCounts
    };
  }

  private analyzeTagPatterns(tasks: Task[]): any {
    const tagCounts: { [tag: string]: number } = {};
    
    tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    
    return {
      mostUsedTags: sortedTags,
      totalUniqueTags: Object.keys(tagCounts).length,
      averageTagsPerTask: tasks.length > 0 ? 
        tasks.reduce((sum, task) => sum + (task.tags?.length || 0), 0) / tasks.length : 0
    };
  }

  private findMostProductiveTime(tasks: Task[]): number {
    const completedTasks = tasks.filter(task => task.completed);
    const hourCounts: { [hour: number]: number } = {};
    
    completedTasks.forEach(task => {
      const hour = new Date(task.updatedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    return this.findMostActiveKey(hourCounts);
  }

  private calculateAverageTaskDuration(tasks: Task[]): number {
    const completedTasks = tasks.filter(task => task.completed);
    if (completedTasks.length === 0) return 0;
    
    const totalDuration = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt);
      const completed = new Date(task.updatedAt);
      return sum + (completed.getTime() - created.getTime());
    }, 0);
    
    return Math.round(totalDuration / completedTasks.length / (1000 * 60 * 60 * 24)); // ימים
  }

  private findMostActiveKey(counts: { [key: number]: number }): number {
    return Object.entries(counts)
      .reduce((max, [key, count]) => count > max.count ? { key: parseInt(key), count } : max, 
              { key: -1, count: 0 }).key;
  }
}

// Main Tool Registry Class
export class TaskFlowToolRegistry {
  private tools: Map<string, Tool> = new Map();
  
  constructor() {
    this.registerTool(new TaskManagementTool());
    this.registerTool(new SearchTool());
    this.registerTool(new PlanningTool());
    this.registerTool(new AnalyticsTool());
  }
  
  private registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    console.log(`🔧 Registered tool: ${tool.name}`);
  }
  
  async selectOptimalTools(userIntent: string, context: AIContext): Promise<Tool[]> {
    console.log('🎯 Selecting optimal tools for intent:', userIntent);
    
    const intent = userIntent.toLowerCase();
    const selectedTools: Tool[] = [];
    
    // Smart tool selection based on keywords
    if (this.containsAny(intent, ['יצור', 'הוסף', 'צור', 'משימה חדשה', 'רוצה ליצור'])) {
      selectedTools.push(this.tools.get('task_management')!);
    }
    
    if (this.containsAny(intent, ['חפש', 'מצא', 'איפה', 'ראה', 'הצג'])) {
      selectedTools.push(this.tools.get('search')!);
    }
    
    if (this.containsAny(intent, ['תכנן', 'תוכנית', 'לוח זמנים', 'ארגן', 'סדר'])) {
      selectedTools.push(this.tools.get('planning')!);
    }
    
    if (this.containsAny(intent, ['ניתוח', 'סטטיסטיקה', 'איך אני מתקדם', 'פרודקטיביות', 'דו״ח'])) {
      selectedTools.push(this.tools.get('analytics')!);
    }
    
    // If no specific tools selected, default to task management
    if (selectedTools.length === 0) {
      selectedTools.push(this.tools.get('task_management')!);
    }
    
    console.log(`🎯 Selected ${selectedTools.length} tools:`, selectedTools.map(t => t.name));
    return selectedTools;
  }
  
  async executeTool(toolName: string, params: any, context: ToolContext): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    console.log(`🚀 Executing tool: ${toolName} with params:`, params);
    return await tool.execute(params, context);
  }
  
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  getToolByName(name: string): Tool | undefined {
    return this.tools.get(name);
  }
  
  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }
}

// Export singleton instance
export const toolRegistry = new TaskFlowToolRegistry();
