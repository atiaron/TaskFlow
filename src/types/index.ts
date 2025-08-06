/**
 * TaskFlow - Core Type Definitions
 * מסמך מקור: SYSTEM_DESIGN_AND_IMPROVEMENTS_2025.md
 * תאריך יצירה: 6 באוגוסט 2025
 * 
 * תכנון מושלם של כל ה-types במערכת לפי המסמך המפורט
 */

// ========================
// 🗨️ Sessions & Messages (Sub-Collections)
// ========================

// Export all session-related types
export * from './sessions';

// ========================
// 🤖 AI & Chat Types (Legacy + Compatible)
// ========================

export interface Message {
  id: string;
  chat_id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  tokens_used?: number;
  actions?: MessageAction[];
  status?: MessageStatus;
  error_message?: string;
}

export interface MessageAction {
  type: 'task_created' | 'task_updated' | 'reminder_set' | 'calendar_event';
  data: any;
  timestamp: Date;
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'retry';

export interface Chat {
  id: string;
  user_id: string;
  title: string; // AI-generated או fallback
  created_at: Date;
  updated_at: Date;
  status: ChatStatus;
  message_count: number;
  summary?: string; // AI-generated summary
  is_starred?: boolean;
  last_message?: string;
}

export type ChatStatus = 'active' | 'archived' | 'deleted';

// ChatSession is an alias for Chat - used in SessionManager for clarity
export type ChatSession = Chat & {
  createdAt: Date;  // alias for created_at
  updatedAt: Date;  // alias for updated_at
  messageCount: number;  // alias for message_count
  isStarred?: boolean;  // alias for is_starred (optional, like in Chat)
  userId: string;  // alias for user_id for session management (required)
};

// ChatMessage is an alias for Message - used for compatibility
export type ChatMessage = Message;

export interface ClaudeAPIRequest {
  message: string;
  context?: ChatContext;
  user_profile?: UserProfile;
  system_prompt?: string;
}

export interface ClaudeAPIResponse {
  content: string;
  tokens_used: number;
  confidence_score?: number;
  suggested_actions?: TaskSuggestion[];
  reasoning?: string;
  error?: string;
}

export interface ChatContext {
  recent_messages: Message[];
  current_tasks: Task[];
  user_preferences: UserPreferences;
  session_info: SessionInfo;
}

export interface TaskSuggestion {
  confidence: number; // 0-100
  action: 'create_task' | 'ask_confirmation' | 'none';
  task?: Partial<Task>;
  message: string;
  reasoning?: string;
}

// ========================
// 📋 Task Management Types  
// ========================

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TaskPriority;
  category?: TaskCategory;
  dueDate?: Date; // Updated for consistency
  due_date?: Date; // Keep for backward compatibility
  reminder_time?: Date;
  createdAt: Date; // Updated for consistency
  created_at: Date; // Keep for backward compatibility
  updatedAt: Date; // Updated for consistency
  updated_at: Date; // Keep for backward compatibility
  created_by: TaskSource;
  estimated_duration?: number; // minutes
  estimatedTime?: number; // minutes - alias for estimated_duration
  actual_duration?: number; // minutes
  tags?: string[];
  parent_id?: string; // for future sub-tasks
  
  // Sync & Conflict Resolution
  version: number;
  last_modified_by: string; // device_id
  sync_status?: SyncStatus;
  
  // Future features
  shared_with?: string[];
  permissions?: Record<string, Permission>;
  team_id?: string;
  recurrence?: RecurrenceRule;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskCategory = 
  | 'עבודה' | 'work'
  | 'בית' | 'home'  
  | 'קניות' | 'shopping'
  | 'בריאות' | 'health'
  | 'אישי' | 'personal'
  | 'לימודים' | 'study'
  | 'לוח שנה' | 'calendar'
  | 'אחר' | 'other';

export type TaskSource = 'manual' | 'ai_chat' | 'calendar_import' | 'voice_input';

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'failed';

export type Permission = 'read' | 'write' | 'admin';

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // every N days/weeks/months
  days_of_week?: number[]; // 0-6, Sunday = 0
  end_date?: Date;
  max_occurrences?: number;
}

// ========================
// 👤 User & Profile Types
// ========================

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: Date;
  last_active: Date;
  plan: UserPlan;
  settings: UserSettings;
  preferences: UserPreferences;
  usage_stats: UsageStats;
}

export type UserPlan = 'personal_unlimited' | 'free' | 'premium' | 'team';

export interface UserSettings {
  language: 'he' | 'en';
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  
  // Notifications
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  daily_planning_time?: string; // HH:mm format
  evening_review_time?: string;
  
  // AI Behavior
  ai_suggestions_enabled: boolean;
  auto_task_creation: boolean;
  confirmation_threshold: number; // 0-100
  
  // Privacy & Security
  privacy_mode: boolean;
  data_retention_days?: number;
  sensitive_data_encryption: boolean;
  
  // Cost Control (Personal)
  cost_alerts: boolean;
  monthly_budget?: number;
  optimization_mode: boolean;
}

export interface UserPreferences {
  preferred_categories: TaskCategory[];
  default_priority: TaskPriority;
  default_duration: number; // minutes
  work_hours: {
    start: string; // HH:mm
    end: string; // HH:mm
    days: number[]; // 0-6
  };
  break_reminders: boolean;
  focus_mode_duration: number; // minutes
}

export interface UserProfile {
  work_patterns: WorkPattern[];
  task_preferences: TaskPreferences;
  ai_interaction_style: AIInteractionStyle;
  productivity_metrics: ProductivityMetrics;
}

export interface WorkPattern {
  time_slot: string; // e.g., "09:00-11:00"
  productivity_level: 'low' | 'medium' | 'high';
  preferred_task_types: TaskCategory[];
  average_duration: number;
}

export interface TaskPreferences {
  auto_categorization: boolean;
  preferred_reminder_lead_time: number; // minutes
  default_task_duration: number; // minutes
  break_task_threshold: number; // minutes - when to suggest breaking down
}

export interface AIInteractionStyle {
  formality_level: 'casual' | 'professional' | 'friendly';
  explanation_detail: 'brief' | 'detailed' | 'comprehensive';
  suggestion_frequency: 'minimal' | 'moderate' | 'proactive';
  learning_enabled: boolean;
}

export interface ProductivityMetrics {
  tasks_completed_this_week: number;
  completion_rate: number; // 0-100
  average_task_duration: number; // minutes
  most_productive_hours: string[];
  focus_time_today: number; // minutes
  streak_days: number;
}

// ========================
// 🔄 Sync & Conflict Resolution
// ========================

export interface SyncOperation {
  id: string;
  operation_type: SyncOperationType;
  entity_type: 'task' | 'chat' | 'message' | 'settings';
  entity_id: string;
  data: any;
  timestamp: Date;
  device_id: string;
  status: SyncOperationStatus;
  retry_count: number;
  error_message?: string;
}

export type SyncOperationType = 'create' | 'update' | 'delete' | 'restore';
export type SyncOperationStatus = 'pending' | 'completed' | 'failed' | 'conflict';

export interface ConflictResolution {
  id: string;
  entity_type: 'task' | 'chat' | 'message';
  entity_id: string;
  conflict_type: ConflictType;
  local_version: any;
  remote_version: any;
  resolution_strategy?: ResolutionStrategy;
  resolved_version?: any;
  resolved_at?: Date;
  resolved_by: 'user' | 'auto' | 'smart_merge';
}

export type ConflictType = 'simultaneous_edit' | 'delete_vs_edit' | 'version_mismatch';
export type ResolutionStrategy = 'take_local' | 'take_remote' | 'smart_merge' | 'user_decision';

// ========================
// 🔐 Security & Privacy
// ========================

export interface SecurityScanResult {
  has_sensitive_data: boolean;
  detected_patterns: SensitiveDataPattern[];
  confidence_score: number; // 0-100
  recommendations: SecurityRecommendation[];
  sanitized_content?: string;
}

export interface SensitiveDataPattern {
  type: SensitiveDataType;
  pattern: string;
  position: { start: number; end: number };
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type SensitiveDataType = 
  | 'password' 
  | 'credit_card' 
  | 'ssn' 
  | 'phone_number' 
  | 'email_address'
  | 'medical_info'
  | 'personal_id'
  | 'api_key'
  | 'bank_account';

export interface SecurityRecommendation {
  type: 'warning' | 'suggestion' | 'action_required';
  message: string;
  action?: SecurityAction;
}

export interface SecurityAction {
  type: 'redact' | 'encrypt' | 'delete' | 'mask';
  description: string;
  auto_applicable: boolean;
}

// ========================
// ⚡ Performance & Monitoring
// ========================

export interface PerformanceMetrics {
  page_load_time: number;
  first_contentful_paint: number;
  largest_contentful_paint: number;
  cumulative_layout_shift: number;
  first_input_delay: number;
  claude_response_time: number;
  database_query_time: number;
  bundle_size: number;
  memory_usage: number;
}

export interface ErrorLog {
  id: string;
  error_type: ErrorType;
  message: string;
  stack_trace?: string;
  user_id?: string;
  session_id: string;
  timestamp: Date;
  context: ErrorContext;
  resolved: boolean;
  resolution_notes?: string;
}

export type ErrorType = 
  | 'claude_api_error'
  | 'network_error' 
  | 'database_error'
  | 'ui_error'
  | 'security_error'
  | 'performance_error'
  | 'sync_error';

export interface ErrorContext {
  url: string;
  user_agent: string;
  component: string;
  action: string;
  additional_data?: Record<string, any>;
}

// ========================
// 🎨 UI/UX Types
// ========================

export interface UIState {
  current_view: AppView;
  sidebar_open: boolean;
  chat_panel_open: boolean;
  loading_states: LoadingStates;
  active_modals: Modal[];
  notifications: Notification[];
  theme: ThemeConfig;
}

export type AppView = 
  | 'dashboard' 
  | 'tasks' 
  | 'chat' 
  | 'calendar' 
  | 'settings' 
  | 'analytics'
  | 'focus_mode';

export interface LoadingStates {
  claude_thinking: boolean;
  tasks_loading: boolean;
  sync_in_progress: boolean;
  initial_load: boolean;
}

export interface Modal {
  id: string;
  type: ModalType;
  props: any;
  closable: boolean;
}

export type ModalType = 
  | 'task_edit'
  | 'settings'
  | 'conflict_resolution'
  | 'data_export'
  | 'security_warning'
  | 'cost_alert';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
  auto_dismiss_after?: number; // seconds
}

export type NotificationType = 
  | 'success'
  | 'error' 
  | 'warning'
  | 'info'
  | 'task_reminder'
  | 'daily_planning'
  | 'achievement';

export interface NotificationAction {
  label: string;
  action: string;
  style: 'primary' | 'secondary' | 'danger';
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_size: 'small' | 'medium' | 'large';
  compact_mode: boolean;
  high_contrast: boolean;
}

// ========================
// 💰 Business & Analytics
// ========================

export interface UsageStats {
  // Current Period
  messages_this_month: number;
  tasks_created_this_month: number;
  tasks_completed_this_month: number;
  claude_api_calls: number;
  
  // Costs
  estimated_monthly_cost: number;
  actual_monthly_cost: number;
  cost_breakdown: CostBreakdown;
  
  // Productivity
  completion_rate: number;
  average_task_duration: number;
  most_active_hours: string[];
  streak_days: number;
  
  // Features
  most_used_features: FeatureUsage[];
  ai_satisfaction_rating: number; // 1-5
  
  // Performance
  average_response_time: number;
  error_rate: number;
  uptime_percentage: number;
}

export interface CostBreakdown {
  claude_api: number;
  firebase_storage: number;
  firebase_operations: number;
  other_services: number;
  total: number;
}

export interface FeatureUsage {
  feature_name: string;
  usage_count: number;
  time_spent: number; // minutes
  last_used: Date;
}

// ========================
// 🔧 System & Configuration
// ========================

export interface AppConfig {
  app_version: string;
  environment: 'development' | 'staging' | 'production';
  feature_flags: FeatureFlags;
  api_endpoints: APIEndpoints;
  limits: SystemLimits;
  monitoring: MonitoringConfig;
}

export interface FeatureFlags {
  // Current Features
  ai_chat_enabled: boolean;
  task_auto_creation: boolean;
  offline_mode: boolean;
  push_notifications: boolean;
  
  // Future Features
  voice_input: boolean;
  calendar_integration: boolean;
  team_collaboration: boolean;
  advanced_analytics: boolean;
  multi_language: boolean;
  
  // Business Features
  payment_processing: boolean;
  multi_user: boolean;
  api_access: boolean;
  white_label: boolean;
}

export interface APIEndpoints {
  claude_api: string;
  firebase_config: any;
  calendar_api?: string;
  monitoring_endpoint?: string;
  support_endpoint?: string;
}

export interface SystemLimits {
  max_messages_per_chat: number;
  max_tasks_per_user: number;
  max_file_upload_size: number;
  rate_limit_requests_per_minute: number;
  session_timeout_minutes: number;
}

export interface MonitoringConfig {
  sentry_dsn?: string;
  analytics_enabled: boolean;
  error_reporting: boolean;
  performance_tracking: boolean;
  user_behavior_tracking: boolean;
}

// ========================
// 🔄 Session & Auth
// ========================

export interface SessionInfo {
  session_id: string;
  user_id: string;
  device_id: string;
  start_time: Date;
  last_activity: Date;
  ip_address?: string;
  user_agent: string;
  is_active: boolean;
}

export interface AuthState {
  is_authenticated: boolean;
  user: User | null;
  session: SessionInfo | null;
  permissions: string[];
  expires_at?: Date;
}

// ========================
// 📅 Calendar Integration (Future)
// ========================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  all_day: boolean;
  calendar_id: string;
  source: 'google' | 'outlook' | 'apple' | 'taskflow';
  related_task_id?: string;
  attendees?: string[];
  location?: string;
}

export interface CalendarIntegration {
  provider: 'google' | 'outlook' | 'apple';
  calendar_id: string;
  sync_enabled: boolean;
  sync_direction: 'one_way' | 'two_way';
  last_sync: Date;
  sync_status: 'success' | 'error' | 'pending';
}

// ========================
// 🎯 Utility Types
// ========================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type OptionalExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export type Timestamp = Date | string | number;

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  request_id: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_previous: boolean;
}

// ========================
// 🔍 Search & Filtering
// ========================

export interface SearchQuery {
  query: string;
  filters: SearchFilters;
  sort: SortOptions;
  pagination: PaginationOptions;
}

export interface SearchFilters {
  entity_types?: ('task' | 'chat' | 'message')[];
  date_range?: { start: Date; end: Date };
  categories?: TaskCategory[];
  priorities?: TaskPriority[];
  completed?: boolean;
  user_id?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  per_page: number;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  highlights: SearchHighlight[];
}

export interface SearchHighlight {
  field: string;
  matches: { start: number; end: number; text: string }[];
}

// ========================
// 🔗 Export Everything
// ========================

// Note: These will be created in future phases
// export * from './api';
// export * from './components';  
// export * from './hooks';

// Re-export commonly used types for convenience
export type TaskWithStats = Task & {
  completion_percentage?: number;
  time_spent?: number;
  related_tasks?: Task[];
};

export type ChatWithMessages = Chat & {
  messages: Message[];
  unread_count?: number;
};

// Reasoning Display Types
export interface ReasoningStep {
  type: string;
  content: string;
  reasoning: string;
  timestamp?: Date;
  metadata?: any;
}

export type UserWithDetails = User & {
  recent_activity: any[];
  connected_integrations: any[];
};
