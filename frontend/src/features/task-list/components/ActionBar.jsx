import React from 'react';
import './all-done.css';

/**
 * ActionBar Component - Bottom action bar with Undo/Confirm actions
 * 
 * Provides actions for undoing last completion or confirming the all-done state
 */
const ActionBar = ({ onUndo, onConfirm }) => {
  return (
    <div className="action-bar">
      <button 
        className="action-btn action-btn--undo"
        onClick={onUndo}
        aria-label="ביטול הפעולה"
      >
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 14L4 9L9 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20 20V13C20 10.7909 18.2091 9 16 9H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        ביטול הפעולה
      </button>
      
      <button 
        className="action-btn action-btn--confirm"
        onClick={onConfirm}
        aria-label="סומן שהמשימה בוצעה"
      >
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        סומן שהמשימה בוצעה
      </button>
    </div>
  );
};

export default ActionBar;