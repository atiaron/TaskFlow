// src/features/task-list/SimpleEmptyState.jsx

import React from 'react';
import FAB from './components/FAB';
import NewTaskInput from './components/NewTaskInput';

export default function SimpleEmptyState({
  onCreateTask,
  isCreating,
  setIsCreating,
}) {
  const createHandler = (title) => {
    if (onCreateTask) onCreateTask(title);
    setIsCreating(false);
  };

  const handleCancel = () => setIsCreating(false);

  return (
    <div className="google-tasks-wrapper" dir="rtl">
      {/* Status Bar + Navigation Bar */}
      <header className="google-tasks-header">
        <div className="google-tasks-status-bar"></div>
        <nav className="google-tasks-nav">
          <button className="google-tasks-icon-button" aria-label="תפריט" type="button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          <div className="google-tasks-title-container">
            <h1 className="google-tasks-title">המשימות שלי</h1>
          </div>
        </nav>
      </header>

      {/* Main Content - Empty State */}
      <main className="google-tasks-content">
        <div className="google-tasks-empty-state">
          {/* Main Empty State Container */}
          <div className="google-tasks-empty-container">
            {/* Task Icon - Simple circular icon with checkmark */}
            <div className="google-tasks-empty-icon">
              <svg viewBox="0 0 24 24" className="google-tasks-check-icon" aria-hidden="true" focusable="false">
                <path d="M9 16.2l-3.5-3.5c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l4.19 4.19c.39.39 1.02.39 1.41 0L20.3 7.7c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0L9 16.2z" fill="#5F6368" />
              </svg>
            </div>
            
            {/* Empty State Text */}
            <div className="google-tasks-empty-text">
              <h2 className="google-tasks-empty-title">
                מוכן להתארגן?
              </h2>
              <p className="google-tasks-empty-subtitle">
                משימות מסייעות לך לעקוב אחר עבודה יומיומית,<br />
                להתארגן ולהתמקד במה שחשוב.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="google-tasks-empty-actions">
              <button 
                className="google-tasks-learn-more-button"
                onClick={() => window.open('https://support.google.com/tasks/', '_blank')}
                type="button"
              >
                מידע נוסף
              </button>
            </div>
          </div>

          {/* In-place creation area - only show when creating */}
          {isCreating && (
            <div className="google-tasks-inline-creation">
              <NewTaskInput
                open
                onSubmit={(title) => {
                  const ok = onCreateTask ? onCreateTask(title) : true;
                  if (ok !== false) setIsCreating(false);
                }}
                onCancel={handleCancel}
                autoFocus
                placeholder="משימה חדשה"
              />
            </div>
          )}
        </div>
      </main>

      {/* FAB - Always visible */}
      <FAB onClick={() => setIsCreating(true)} />

      {/* Bottom Safe Area */}
      <div className="google-tasks-safe-area"></div>
    </div>
  );
}