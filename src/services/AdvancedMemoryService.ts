/**
 * TaskFlow Advanced Memory System
 * מערכת זיכרון היררכית מתקדמת עם למידה אדפטיבית
 */
import { Task, User, ChatMessage } from '../types';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// Enhanced Memory Types
export interface UserInteraction {
  id: string;
  userId: string;
  type: 'task_created' | 'task_completed' | 'task_deleted' | 'chat_message' | 'planning_session' | 'analytics_view';
  data: any;
  context: {
    timeOfDay: number;
    dayOfWeek: number;
    tasksCount: number;
    mood?: 'productive' | 'stressed' | 'relaxed';
  };
  timestamp: Date;
}

export interface UserPattern {
  id: string;
  type: 'temporal' | 'behavioral' | 'preference';
  pattern: string;
  frequency: number;
  confidence: number;
  examples: UserInteraction[];
  lastSeen: Date;
}

export interface ConversationContext {
  currentSession: ChatMessage[];
  activeTopics: string[];
  recentTasks: Task[];
  sessionStartTime: Date;
  userMood?: 'productive' | 'stressed' | 'relaxed';
}

export interface UserProfile {
  userId: string;
  preferences: {
    preferredWorkingHours: { start: number; end: number };
    taskCategories: string[];
    priorityStyle: 'urgent_first' | 'important_first' | 'balanced';
    planningFrequency: 'daily' | 'weekly' | 'monthly';
    reminderStyle: 'gentle' | 'assertive' | 'minimal';
  };
  patterns: UserPattern[];
  productivity_insights: {
    mostProductiveTime: number;
    averageTasksPerDay: number;
    completionRate: number;
    preferredTaskTypes: string[];
    workStreaks: { start: Date; end: Date; tasksCompleted: number }[];
  };
  lastUpdated: Date;
}

export interface MemoryContext {
  recentContext: ChatMessage[];
  similarSessions: any[];
  preferences: UserProfile['preferences'];
  relevantPatterns: UserPattern[];
  currentProductivityState: 'high' | 'medium' | 'low';
}

// Main Memory System Class
export class TaskFlowMemorySystem {
  private workingMemory: ConversationContext;
  private episodicMemory: UserInteraction[] = [];
  private semanticMemory: UserProfile | null = null;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.workingMemory = {
      currentSession: [],
      activeTopics: [],
      recentTasks: [],
      sessionStartTime: new Date()
    };
  }

  // Public getter for userId
  public get currentUserId(): string {
    return this.userId;
  }

  // Initialize memory system for user
  async initialize(): Promise<void> {
    console.log('🧠 Initializing memory system for user:', this.userId);
    
    try {
      // Load existing user profile
      this.semanticMemory = await this.loadUserProfile();
      
      // Load recent interactions
      this.episodicMemory = await this.loadRecentInteractions();
      
      // Initialize working memory with recent context
      await this.initializeWorkingMemory();
      
      console.log('✅ Memory system initialized successfully');
    } catch (error) {
      console.error('❌ Memory system initialization failed:', error);
      // Create empty profile if none exists
      this.semanticMemory = await this.createEmptyProfile();
    }
  }

  // Store new interaction
  async storeInteraction(interaction: Omit<UserInteraction, 'id' | 'userId' | 'timestamp'>): Promise<void> {
    const fullInteraction: UserInteraction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      timestamp: new Date(),
      ...interaction
    };

    console.log('💾 Storing interaction:', fullInteraction.type);

    // Add to working memory
    this.workingMemory.currentSession.push({
      id: fullInteraction.id,
      content: this.extractMessageContent(fullInteraction),
      sender: fullInteraction.type.includes('chat') ? 'user' : 'ai',
      timestamp: fullInteraction.timestamp,
      type: 'text'
    });

    // Add to episodic memory
    this.episodicMemory.push(fullInteraction);
    
    // Keep only last 100 interactions in memory
    if (this.episodicMemory.length > 100) {
      this.episodicMemory = this.episodicMemory.slice(-100);
    }

    // Extract and update patterns
    await this.extractAndUpdatePatterns(fullInteraction);
    
    // Update user profile
    await this.updateUserProfile(fullInteraction);
    
    // Persist to Firebase
    await this.persistInteraction(fullInteraction);
  }

  // Get relevant context for AI
  async getRelevantContext(query: string): Promise<MemoryContext> {
    console.log('🔍 Getting relevant context for query:', query);
    
    const context: MemoryContext = {
      recentContext: this.getRecentMessages(),
      similarSessions: await this.findSimilarSessions(query),
      preferences: this.semanticMemory?.preferences || this.getDefaultPreferences(),
      relevantPatterns: await this.findRelevantPatterns(query),
      currentProductivityState: this.assessCurrentProductivityState()
    };

    console.log('📊 Context retrieved:', {
      recentMessages: context.recentContext.length,
      similarSessions: context.similarSessions.length,
      patterns: context.relevantPatterns.length,
      productivityState: context.currentProductivityState
    });

    return context;
  }

  // Extract patterns from interactions
  private async extractAndUpdatePatterns(interaction: UserInteraction): Promise<void> {
    if (!this.semanticMemory) return;

    const patterns: UserPattern[] = [];

    // Temporal patterns
    const timePattern = this.extractTemporalPattern(interaction);
    if (timePattern) patterns.push(timePattern);

    // Behavioral patterns
    const behaviorPattern = this.extractBehavioralPattern(interaction);
    if (behaviorPattern) patterns.push(behaviorPattern);

    // Task preference patterns
    if (interaction.type === 'task_created' && interaction.data.task) {
      const preferencePattern = this.extractPreferencePattern(interaction);
      if (preferencePattern) patterns.push(preferencePattern);
    }

    // Update existing patterns or add new ones
    for (const newPattern of patterns) {
      const existingPattern = this.semanticMemory.patterns.find(
        p => p.type === newPattern.type && p.pattern === newPattern.pattern
      );

      if (existingPattern) {
        existingPattern.frequency++;
        existingPattern.confidence = Math.min(existingPattern.confidence + 0.1, 1.0);
        existingPattern.examples.push(interaction);
        existingPattern.lastSeen = new Date();
      } else {
        this.semanticMemory.patterns.push(newPattern);
      }
    }

    // Remove old patterns (not seen in 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.semanticMemory.patterns = this.semanticMemory.patterns.filter(
      p => new Date(p.lastSeen) > thirtyDaysAgo
    );
  }

  private extractTemporalPattern(interaction: UserInteraction): UserPattern | null {
    const hour = interaction.context.timeOfDay;
    const dayOfWeek = interaction.context.dayOfWeek;
    
    let pattern = '';
    if (hour >= 6 && hour < 12) pattern = 'morning_active';
    else if (hour >= 12 && hour < 17) pattern = 'afternoon_active';
    else if (hour >= 17 && hour < 22) pattern = 'evening_active';
    else return null;

    return {
      id: `temporal_${pattern}_${dayOfWeek}`,
      type: 'temporal',
      pattern: `${pattern}_day_${dayOfWeek}`,
      frequency: 1,
      confidence: 0.5,
      examples: [interaction],
      lastSeen: new Date()
    };
  }

  private extractBehavioralPattern(interaction: UserInteraction): UserPattern | null {
    const behaviorMap: { [key: string]: string } = {
      'task_created': 'creates_tasks',
      'task_completed': 'completes_tasks',
      'planning_session': 'plans_ahead',
      'analytics_view': 'tracks_progress'
    };

    const behavior = behaviorMap[interaction.type];
    if (!behavior) return null;

    return {
      id: `behavioral_${behavior}`,
      type: 'behavioral',
      pattern: behavior,
      frequency: 1,
      confidence: 0.6,
      examples: [interaction],
      lastSeen: new Date()
    };
  }

  private extractPreferencePattern(interaction: UserInteraction): UserPattern | null {
    const task = interaction.data.task as Task;
    if (!task) return null;

    const preferences: string[] = [];
    
    if (task.priority) preferences.push(`prefers_${task.priority}_priority`);
    if (task.tags) {
      task.tags.forEach(tag => preferences.push(`uses_tag_${tag}`));
    }
    if (task.estimatedTime) {
      if (task.estimatedTime <= 30) preferences.push('prefers_short_tasks');
      else if (task.estimatedTime >= 120) preferences.push('prefers_long_tasks');
    }

    if (preferences.length === 0) return null;

    return {
      id: `preference_${preferences[0]}`,
      type: 'preference',
      pattern: preferences[0],
      frequency: 1,
      confidence: 0.4,
      examples: [interaction],
      lastSeen: new Date()
    };
  }

  // Find similar past sessions
  private async findSimilarSessions(query: string): Promise<any[]> {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(' ').filter(word => word.length > 2);
    
    const similarInteractions = this.episodicMemory.filter(interaction => {
      const content = this.extractMessageContent(interaction).toLowerCase();
      return keywords.some(keyword => content.includes(keyword));
    });

    // Group by session (interactions within 1 hour of each other)
    const sessions: any[] = [];
    let currentSession: UserInteraction[] = [];
    let lastTimestamp = 0;

    for (const interaction of similarInteractions) {
      const timestamp = new Date(interaction.timestamp).getTime();
      
      if (timestamp - lastTimestamp > 3600000) { // 1 hour gap
        if (currentSession.length > 0) {
          sessions.push({
            interactions: currentSession,
            relevance: this.calculateSessionRelevance(currentSession, keywords),
            timestamp: currentSession[0].timestamp
          });
        }
        currentSession = [interaction];
      } else {
        currentSession.push(interaction);
      }
      
      lastTimestamp = timestamp;
    }

    // Add final session
    if (currentSession.length > 0) {
      sessions.push({
        interactions: currentSession,
        relevance: this.calculateSessionRelevance(currentSession, keywords),
        timestamp: currentSession[0].timestamp
      });
    }

    // Sort by relevance and return top 3
    return sessions
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);
  }

  private calculateSessionRelevance(interactions: UserInteraction[], keywords: string[]): number {
    let relevance = 0;
    
    for (const interaction of interactions) {
      const content = this.extractMessageContent(interaction).toLowerCase();
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          relevance += 1;
        }
      }
    }
    
    return relevance / (interactions.length * keywords.length);
  }

  // Find relevant patterns for query
  private async findRelevantPatterns(query: string): Promise<UserPattern[]> {
    if (!this.semanticMemory) return [];

    const queryLower = query.toLowerCase();
    
    return this.semanticMemory.patterns.filter(pattern => {
      // Check if pattern is relevant to query
      if (queryLower.includes('בוקר') && pattern.pattern.includes('morning')) return true;
      if (queryLower.includes('ערב') && pattern.pattern.includes('evening')) return true;
      if (queryLower.includes('תכנן') && pattern.pattern.includes('plans')) return true;
      if (queryLower.includes('משימה') && pattern.pattern.includes('task')) return true;
      
      return false;
    }).sort((a, b) => (b.confidence * b.frequency) - (a.confidence * a.frequency));
  }

  // Assess current productivity state
  private assessCurrentProductivityState(): 'high' | 'medium' | 'low' {
    const recentInteractions = this.episodicMemory.filter(
      i => Date.now() - new Date(i.timestamp).getTime() < 3600000 // Last hour
    );

    const completedTasks = recentInteractions.filter(i => i.type === 'task_completed').length;
    const createdTasks = recentInteractions.filter(i => i.type === 'task_created').length;
    
    const productivity = completedTasks * 2 + createdTasks;
    
    if (productivity >= 4) return 'high';
    if (productivity >= 2) return 'medium';
    return 'low';
  }

  // Get recent messages for context
  private getRecentMessages(): ChatMessage[] {
    return this.workingMemory.currentSession.slice(-10); // Last 10 messages
  }

  // Helper methods
  private extractMessageContent(interaction: UserInteraction): string {
    switch (interaction.type) {
      case 'chat_message':
        return interaction.data.message || '';
      case 'task_created':
        return `יצירת משימה: ${interaction.data.task?.title || ''}`;
      case 'task_completed':
        return `השלמת משימה: ${interaction.data.task?.title || ''}`;
      case 'planning_session':
        return 'פעילות תכנון';
      case 'analytics_view':
        return 'צפייה בניתוח פרודקטיביות';
      default:
        return '';
    }
  }

  // Firebase persistence methods
  private async loadUserProfile(): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'user_memory', this.userId));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return data?.profile || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  private async loadRecentInteractions(): Promise<UserInteraction[]> {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const q = query(
        collection(db, 'user_interactions'),
        where('userId', '==', this.userId),
        where('timestamp', '>=', oneWeekAgo),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap: any) => docSnap.data() as UserInteraction);
    } catch (error) {
      console.error('Error loading interactions:', error);
      return [];
    }
  }

  private async persistInteraction(interaction: UserInteraction): Promise<void> {
    try {
      await setDoc(doc(db, 'user_interactions', interaction.id), interaction);
      
      // Also update user profile
      if (this.semanticMemory) {
        await setDoc(doc(db, 'user_memory', this.userId), {
          profile: this.semanticMemory,
          lastUpdated: new Date()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error persisting interaction:', error);
    }
  }

  private async initializeWorkingMemory(): Promise<void> {
    // For now, we'll use a simple approach to load recent tasks
    // In a real implementation, we'd want to use FirebaseService.getTasks
    try {
      // Load recent tasks - simplified for now
      this.workingMemory.recentTasks = [];
    } catch (error) {
      console.error('Error loading recent tasks:', error);
    }
  }

  private async createEmptyProfile(): Promise<UserProfile> {
    return {
      userId: this.userId,
      preferences: this.getDefaultPreferences(),
      patterns: [],
      productivity_insights: {
        mostProductiveTime: 10, // 10 AM default
        averageTasksPerDay: 0,
        completionRate: 0,
        preferredTaskTypes: [],
        workStreaks: []
      },
      lastUpdated: new Date()
    };
  }

  private getDefaultPreferences() {
    return {
      preferredWorkingHours: { start: 9, end: 17 },
      taskCategories: ['עבודה', 'אישי', 'בית'],
      priorityStyle: 'important_first' as const,
      planningFrequency: 'daily' as const,
      reminderStyle: 'gentle' as const
    };
  }

  private async updateUserProfile(interaction: UserInteraction): Promise<void> {
    if (!this.semanticMemory) return;

    // Update productivity insights
    if (interaction.type === 'task_completed') {
      this.semanticMemory.productivity_insights.averageTasksPerDay += 0.1;
      this.semanticMemory.productivity_insights.completionRate = Math.min(
        this.semanticMemory.productivity_insights.completionRate + 0.01,
        1.0
      );
    }

    // Update most productive time
    if (interaction.type === 'task_completed' || interaction.type === 'task_created') {
      const hour = interaction.context.timeOfDay;
      // Weighted average towards current hour
      this.semanticMemory.productivity_insights.mostProductiveTime = 
        (this.semanticMemory.productivity_insights.mostProductiveTime * 0.9) + (hour * 0.1);
    }

    this.semanticMemory.lastUpdated = new Date();
  }
}

// Export for use in other services
export default TaskFlowMemorySystem;
