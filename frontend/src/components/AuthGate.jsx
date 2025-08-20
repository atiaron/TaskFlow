import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from './LoginScreen';

/**
 * AuthGate
 * Wraps protected application content; if not authenticated shows LoginScreen.
 */
export default function AuthGate({ children }) {
  const { isAuthenticated, status } = useAuth();
  if (isAuthenticated) return children;
  return <LoginScreen loading={status === 'loading'} />;
}
