import React from 'react';
import './list-header.css';

/**
 * ListHeader Component - כותר רשימה עם כפתורי בקרה
 * 
 * מוצג מתחת לטאבים ומעל רשימת המשימות
 * כולל שם הרשימה + כפתורי מיון ותפריט (3 נקודות)
 * בהתאם לעיצוב המקורי של Google Tasks
 */
const ListHeader = ({ 
  listName = 'המשימות שלי',
  onSortClick,
  onMenuClick,
  className = ''
}) => {
  return (
    <div className={`list-header ${className}`}>
      <h2 className="list-header-title">{listName}</h2>
      <div className="list-header-controls">
        <button 
          className="list-header-icon-button" 
          onClick={onSortClick}
          aria-label="מיון משימות"
          title="מיון משימות"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M8 18L12 14L16 18M8 6L12 10L16 6" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button 
          className="list-header-icon-button" 
          onClick={onMenuClick}
          aria-label="תפריט רשימה"
          title="תפריט רשימה"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="1" fill="currentColor"/>
            <circle cx="12" cy="5" r="1" fill="currentColor"/>
            <circle cx="12" cy="19" r="1" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ListHeader;