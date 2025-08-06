/**
 * TaskFlow - Sessions & Messages Types
 * Sub-Collections Schema Implementation
 * תאריך יצירה: 6 באוגוסט 2025
 * 
 * מבנה מותאם לFirestore Sub-Collections:
 * /users/{userId}/chat_sessions/{sessionId}
 * /users/{userId}/chat_messages/{messageId}
 */

// ========================
// 🗨️ Chat Sessions Types (Sub-Collection)
// ========================

export interface ChatSessionData {
  // Fields stored in Firestore
  title: string;
  created_at: Date;
  updated_at: Date;
  status: 'active' | 'archived';
  message_count: number;
  context_summary: string;
}

export interface ChatSession extends ChatSessionData {
  // Auto-generated fields
  id: string;
  user_id: string; // Parent document ID
  
  // Aliases for compatibility
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  userId: string;
  isStarred?: boolean;
}

// ========================
// 📨 Chat Messages Types (Sub-Collection)
// ========================

export interface ChatMessageData {
  // Fields stored in Firestore
  session_id: string; // Reference to session
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type: 'text' | 'task' | 'suggestion';
  metadata?: {
    tokens_used?: number;
    actions?: MessageAction[];
    error_message?: string;
  };
}

export interface ChatMessage extends ChatMessageData {
  // Auto-generated fields
  id: string;
  user_id: string; // Parent document ID
  
  // Aliases for compatibility
  sender: 'user' | 'ai';
}

export interface MessageAction {
  type: 'task_created' | 'task_updated' | 'reminder_set' | 'calendar_event';
  data: any;
  timestamp: Date;
}

// ========================
// 🔄 Database Operations Types
// ========================

export interface CreateSessionRequest {
  title?: string;
  context_summary?: string;
}

export interface UpdateSessionRequest {
  title?: string;
  status?: 'active' | 'archived';
  context_summary?: string;
}

export interface CreateMessageRequest {
  session_id: string;
  content: string;
  role: 'user' | 'assistant';
  type?: 'text' | 'task' | 'suggestion';
  metadata?: ChatMessageData['metadata'];
}

// ========================
// 📊 Query & Response Types
// ========================

export interface SessionsQuery {
  status?: 'active' | 'archived';
  limit?: number;
  orderBy?: 'created_at' | 'updated_at';
  orderDirection?: 'asc' | 'desc';
}

export interface MessagesQuery {
  limit?: number;
  orderBy?: 'timestamp';
  orderDirection?: 'asc' | 'desc';
}

export interface SessionWithRecentMessages extends ChatSession {
  recent_messages: ChatMessage[];
  unread_count?: number;
}

// ========================
// 🛠️ Utility Types
// ========================

export type CreateSessionData = Omit<ChatSessionData, 'created_at' | 'updated_at' | 'message_count'>;
export type CreateMessageData = Omit<ChatMessageData, 'timestamp'>;
export type UpdateSessionData = Partial<Pick<ChatSessionData, 'title' | 'status' | 'context_summary'>>;

// ========================
// 🔄 Real-time Subscription Types
// ========================

export type SessionsCallback = (sessions: ChatSession[]) => void;
export type MessagesCallback = (messages: ChatMessage[]) => void;
export type SessionCallback = (session: ChatSession | null) => void;

export interface SubscriptionManager {
  sessions: () => void;
  messages: Map<string, () => void>; // sessionId -> unsubscribe function
}
