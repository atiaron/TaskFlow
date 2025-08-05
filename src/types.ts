export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  settings: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
  googleAccessToken?: string; // לשימוש עם Google Calendar
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date | null;
  tags?: string[];
  estimatedTime?: number; // בדקות
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // יתווסף אוטומטית בFirestore
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'action';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  userId?: string;
}

export interface AIContext {
  currentTasks: Task[];
  recentChats: ChatMessage[];
  userPreferences: any;
  currentTime: Date;
}

// 🆕 הוסף interface לתגובות AI החדשות
export interface AIAction {
  action: 'create_task' | 'update_task' | 'delete_task' | 'schedule_reminder';
  payload: any;
}

export interface AIResponse {
  type: 'text_response' | 'action_success' | 'action_error';
  text?: string;
  data?: any;
  actions?: AIAction[];
}

// 🆕 Joke API interfaces
export interface Joke {
  id: number;
  type: string;
  setup: string;
  punchline: string;
}

export interface JokeApiResponse {
  error?: boolean;
  message?: string;
  setup?: string;
  punchline?: string;
  id?: number;
  type?: string;
}

export interface JokeState {
  joke: Joke | null;
  loading: boolean;
  error: string | null;
}