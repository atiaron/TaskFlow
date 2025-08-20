import React, { useState, useRef, useEffect } from 'react';
import './task-input.css';

/**
 * TaskInput Component
 * Google Tasks style mobile input for adding a new task
 */
const TaskInput = ({ onSave, onCancel }) => {
  const [taskText, setTaskText] = useState('');
  const [showActions, setShowActions] = useState(false);
  const inputRef = useRef(null);
  
  // Auto focus the input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleTextChange = (e) => {
    const text = e.target.value;
    setTaskText(text);
    
    // Show action bar when text is entered
    if (text.trim().length > 0 && !showActions) {
      setShowActions(true);
    } else if (text.trim().length === 0 && showActions) {
      setShowActions(false);
    }
  };
  
  const handleSave = (e) => {
    e.preventDefault();
    if (taskText.trim()) {
      onSave(taskText);
      setTaskText('');
      setShowActions(false);
    }
  };
  
  const handleKeyDown = (e) => {
    // Submit on Enter
    if (e.key === 'Enter') {
      handleSave(e);
    }
    // Close on Escape
    if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  // For future implementation: Star, Time, Menu actions
  const handleStarClick = () => {
    // TODO: implement star metadata on creation
  };
  
  const handleTimeClick = () => {
    // TODO: implement due date picker
  };
  
  const handleMenuClick = () => {
    // TODO: implement extra menu actions
  };

  return (
    <div className="task-input-container">
      <form onSubmit={handleSave}>
        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          className="task-input-field"
          placeholder="משימה חדשה"
          value={taskText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          aria-label="הקלד משימה חדשה"
        />
        
        {/* Action bar - appears when typing */}
        <div className={`task-action-bar ${showActions ? 'task-action-bar-visible' : ''}`}>
          {/* Action icons */}
          <div className="task-action-icons">
            {/* Menu button */}
            <button 
              type="button"
              className="task-action-icon"
              onClick={handleMenuClick}
              aria-label="תפריט נוסף"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            
            {/* Time button */}
            <button 
              type="button"
              className="task-action-icon"
              onClick={handleTimeClick}
              aria-label="הוסף תאריך"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {/* Star button */}
            <button 
              type="button"
              className="task-action-icon"
              onClick={handleStarClick}
              aria-label="סמן בכוכב"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 17.75L5.828 20.995L7.007 14.122L2.007 9.255L8.907 8.255L12 2.002L15.093 8.255L21.993 9.255L16.993 14.122L18.172 20.995L12 17.75Z" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          {/* Save button */}
          <button 
            type="submit"
            className="task-save-button"
            disabled={!taskText.trim()}
            aria-label="שמור משימה"
          >
            שמירה
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskInput;