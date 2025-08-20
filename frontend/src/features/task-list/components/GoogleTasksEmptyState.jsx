import React from 'react';
import './google-tasks-empty-state.css';

/**
 * GoogleTasksEmptyState Component
 * A pixel-perfect recreation of Google Tasks empty state with RTL support
 */
const GoogleTasksEmptyState = ({ message, description, onAddTask }) => {
  return (
    <div className="google-tasks-wrapper" dir="rtl">
      {/* Status Bar + Navigation Bar */}
      <header className="google-tasks-header">
        <div className="google-tasks-status-bar"></div>
        <nav className="google-tasks-nav">
          <button className="google-tasks-icon-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <div className="google-tasks-title-container">
            <h1 className="google-tasks-title">המשימות שלי</h1>
            <button className="google-tasks-icon-button">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <button className="google-tasks-icon-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 17.75L5.82802 20.995L7.00702 14.122L2.00702 9.25495L8.90702 8.25495L12 2.00195L15.093 8.25495L21.993 9.25495L16.993 14.122L18.172 20.995L12 17.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </nav>
        
        {/* Active Tab Indicator */}
        <div className="google-tasks-tab-indicator-container">
          <div className="google-tasks-tab-indicator"></div>
        </div>
      </header>

      {/* Empty State Content */}
      <main className="google-tasks-empty-content">
        {/* Illustration */}
        <div className="google-tasks-illustration">
          {/* Green Circle */}
          <div className="google-tasks-shape google-tasks-circle-green"></div>
          
          {/* Pink Circle */}
          <div className="google-tasks-shape google-tasks-circle-pink"></div>
          
          {/* Character */}
          <div className="google-tasks-character">
            {/* Head */}
            <div className="google-tasks-character-head"></div>
            
            {/* Body */}
            <div className="google-tasks-character-body"></div>
            
            {/* Arms */}
            <div className="google-tasks-character-arm-left"></div>
            <div className="google-tasks-character-arm-right"></div>
            
            {/* Books */}
            <div className="google-tasks-books">
              <div className="google-tasks-book google-tasks-book-1"></div>
              <div className="google-tasks-book google-tasks-book-2"></div>
              <div className="google-tasks-book google-tasks-book-3"></div>
              <div className="google-tasks-book google-tasks-book-4"></div>
            </div>
            
            {/* Decorative Elements */}
            <div className="google-tasks-shape google-tasks-square-yellow"></div>
            <div className="google-tasks-shape google-tasks-circle-blue"></div>
          </div>
        </div>
        
        {/* Message */}
        <h2 className="google-tasks-message">
          {message || 'אין עדיין אף משימה'}
        </h2>
        
        {/* Description */}
        <p className="google-tasks-description">
          {description || 'לכאן אפשר להוסיף את המשימות שלך ב-Google Workspace ולעקוב אחריהן בקלות'}
        </p>
      </main>
      
      {/* Floating Action Button (FAB) */}
      <button 
        className="google-tasks-fab"
        onClick={onAddTask}
        aria-label="הוסף משימה חדשה"
      >
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      {/* Home Indicator for Mobile */}
      <div className="google-tasks-home-indicator-container">
        <div className="google-tasks-home-indicator"></div>
      </div>
    </div>
  );
};

export default GoogleTasksEmptyState;