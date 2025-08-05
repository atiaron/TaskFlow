export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date | null;
  tags: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface AIRequest {
  message: string;
  context?: {
    tasks?: Task[];
    currentDate?: Date;
  };
}

export interface AIResponse {
  message: string;
  suggestions?: {
    type: 'create_task' | 'update_task' | 'complete_task';
    data: any;
  }[];
}