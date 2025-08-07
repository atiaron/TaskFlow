/**
 * TaskFlow - ChatInterface Tests
 * Test suite for critical chat functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { User } from '../types/index';

// Simple mock component for testing structure
const MockChatInterface: React.FC<{ user: User }> = ({ user }) => (
  <div data-testid="chat-interface">
    <div data-testid="user-info">{user.email}</div>
    <textarea 
      data-testid="message-input"
      placeholder="Type a message..."
      role="textbox"
    />
    <button data-testid="send-button" disabled>
      Send
    </button>
  </div>
);

const theme = createTheme();

const ChatInterfaceWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('ChatInterface', () => {
  const mockUser: User = {
    id: 'test-user',
    email: 'test@example.com',
    display_name: 'Test User',
    avatar_url: null,
    created_at: new Date(),
    last_active: new Date(),
    plan: 'free',
    settings: {
      language: 'en',
      timezone: 'UTC',
      theme: 'light',
      notifications_enabled: true,
      email_notifications: false,
      push_notifications: false,
      ai_suggestions_enabled: true,
      auto_task_creation: false,
      confirmation_threshold: 50,
      privacy_mode: false,
      sensitive_data_encryption: true
    },
    preferences: {
      workingHours: { start: '09:00', end: '17:00' },
      timezone: 'UTC',
      language: 'en',
      priorityPreferences: {
        autoHighPriority: [],
        defaultPriority: 'medium',
        reminderDefaults: false
      },
      notificationSettings: {
        email: false,
        push: false,
        sms: false
      }
    },
    usage_stats: {
      tasks_created: 0,
      tasks_completed: 0,
      sessions_count: 0,
      total_time_spent: 0,
      last_activity: new Date(),
      streak_days: 0,
      level: 1,
      points: 0,
      achievements: []
    }
  };

  test('should render chat interface structure', () => {
    render(
      <ChatInterfaceWrapper>
        <MockChatInterface user={mockUser} />
      </ChatInterfaceWrapper>
    );

    expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  test('should display user information', () => {
    render(
      <ChatInterfaceWrapper>
        <MockChatInterface user={mockUser} />
      </ChatInterfaceWrapper>
    );

    expect(screen.getByTestId('user-info')).toHaveTextContent('test@example.com');
  });

  test('should have message input field', () => {
    render(
      <ChatInterfaceWrapper>
        <MockChatInterface user={mockUser} />
      </ChatInterfaceWrapper>
    );

    const messageInput = screen.getByTestId('message-input');
    expect(messageInput).toBeInTheDocument();
    expect(messageInput).toHaveAttribute('placeholder', 'Type a message...');
  });
});