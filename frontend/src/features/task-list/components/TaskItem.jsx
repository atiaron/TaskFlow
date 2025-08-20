import React, { useState, useRef, useEffect } from 'react';
import './task-item.css';
import { playDeleteSound } from '../sounds/complete-sound';

/**
 * TaskItem Component
 * Google Tasks style task item with RTL support
 */
const TaskItem = ({ task, onToggleComplete, onToggleStar, onTaskClick, isSubtask = false, onDeleteTask }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
  
  const handleToggleComplete = () => {
    // Only animate when marking as complete (not uncompleting)
    if (onToggleComplete && !task.completed) {
      // Step 1: Show the checkmark animation
      setIsCompleting(true);
      
      // Step 2: After a short delay for the checkmark to appear, start the slide-out animation
      setTimeout(() => {
        // Then trigger the actual completion after the animation finishes
        setTimeout(() => {
          onToggleComplete(task.id);
          setIsCompleting(false);
        }, 300); // Match the slide-out animation duration
      }, 200); // Short delay for checkmark to appear
    } else if (onToggleComplete) {
      // No animation when uncompleting a task
      onToggleComplete(task.id);
    }
  };
  
  const handleToggleStar = () => {
    if (onToggleStar) {
      onToggleStar(task.id);
    }
  };
  
  const handleTaskClick = (e) => {
    // Only trigger task click if the click wasn't on a button
    if (e.target.closest('.task-star-button') || e.target.closest('.task-checkbox')) {
      return;
    }
    
    if (onTaskClick) {
      onTaskClick(task);
    }
  };
  
  return (
    <div 
      id={`task-${task.id}`} 
      className={`task-item ${isSubtask ? 'subtask' : ''} ${isCompleting ? 'task-completing' : ''} ${isDeleting ? 'task-deleting' : ''}`} 
      onClick={handleTaskClick}
      role="listitem"
      aria-label={`${task.text}${task.completed ? ', הושלם' : ''}${task.starred ? ', מסומן בכוכב' : ''}`}
      tabIndex="0"
      onKeyDown={(e) => {
        // Handle keyboard navigation
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTaskClick(e);
        }
      }}
    >
      {/* Star Button (left in RTL) */}
      <button 
        className={`task-star-button ${task.starred ? 'starred' : ''}`}
        onClick={handleToggleStar}
        aria-label={task.starred ? 'הסר כוכב' : 'סמן בכוכב'}
        aria-pressed={task.starred}
      >
        {task.starred ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 17.75L5.82802 20.995L7.00702 14.122L2.00702 9.25495L8.90702 8.25495L12 2.00195L15.093 8.25495L21.993 9.25495L16.993 14.122L18.172 20.995L12 17.75Z" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 17.75L5.82802 20.995L7.00702 14.122L2.00702 9.25495L8.90702 8.25495L12 2.00195L15.093 8.25495L21.993 9.25495L16.993 14.122L18.172 20.995L12 17.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
      
      {/* Task Text (unified typography) */}
      <div className="task-text gt-text" aria-hidden="true">
        <div className="task-title gt-title">{task.text}</div>
  {/* Placeholder: legacy TaskItem subtitle hook intentionally removed (deprecated subtitle class) */}
      </div>
      
      {/* Three-dot Menu Button */}
      <div className="task-menu-wrapper" ref={menuRef}>
        <button 
          className="task-menu-button"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          aria-label="אפשרויות נוספות"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor"/>
            <path d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z" fill="currentColor"/>
            <path d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z" fill="currentColor"/>
          </svg>
        </button>
        
        {/* Menu Dropdown */}
        {showMenu && (
          <div className="task-menu-dropdown">
            <button 
              className="task-menu-item"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                if (onTaskClick) {
                  onTaskClick(task);
                }
              }}
            >
              <span className="task-menu-item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4V11H11V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 4H13V11H20V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 13H4V20H11V13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 13H13V20H20V13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span>עריכה</span>
            </button>
            <button 
              className="task-menu-item"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                // First click to edit, then the date picker will be available in the edit screen
                if (onTaskClick) {
                  onTaskClick(task);
                }
              }}
            >
              <span className="task-menu-item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span>הוספת תאריך</span>
            </button>
            <button 
              className="task-menu-item"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                // Animate deletion
                setIsDeleting(true);
                
                // Play delete sound
                playDeleteSound();
                
                // Wait for animation to complete before actual deletion
                setTimeout(() => {
                  if (onDeleteTask) {
                    onDeleteTask(task.id);
                  } else {
                    // Default delete dialog if no handler was provided
                    if (window.confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
                      // deletion confirmed (no log)
                    }
                  }
                }, 300); // Match animation duration
              }}
            >
              <span className="task-menu-item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span>מחיקה</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Checkbox (right in RTL) */}
      <button 
        className={`task-checkbox ${task.completed ? 'completed' : ''} ${isCompleting ? 'completing' : ''}`}
        onClick={handleToggleComplete}
        aria-label={task.completed ? 'סמן כלא הושלם' : 'סמן כהושלם'}
        aria-checked={task.completed}
        role="checkbox"
      >
        {task.completed || isCompleting ? (
          <svg 
            className="checkmark" 
            width="18" 
            height="18" 
            viewBox="0 0 18 18" 
            fill="none" 
            aria-hidden="true" focusable="false"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="9" cy="9" r="9" fill="#1A73E8" />
            <path d="M5 9L7.5 11.5L13 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <div className="task-checkbox-circle"></div>
        )}
      </button>
    </div>
  );
};

export default TaskItem;