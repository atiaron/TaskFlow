import React from 'react';
import './all-done.css';

/**
 * AllDoneCard Component - Celebration card when all tasks are completed
 * 
 * Shows a congratulatory message with illustration when the user completes all tasks
 */
const AllDoneCard = ({ listName = 'המשימות שלי' }) => {
  return (
    <div className="all-done-card">
      <div className="all-done-hero">
        {/* Celebration illustration - reuse from empty state but with different colors */}
        <div className="google-tasks-illustration celebration">
          <div className="google-tasks-shape google-tasks-circle-green celebration"></div>
          <div className="google-tasks-shape google-tasks-circle-pink celebration"></div>
          <div className="google-tasks-character celebration">
            <div className="google-tasks-character-head celebration"></div>
            <div className="google-tasks-character-body celebration"></div>
            <div className="google-tasks-character-arm-left celebration"></div>
            <div className="google-tasks-character-arm-right celebration"></div>
            <div className="google-tasks-books celebration">
              <div className="google-tasks-book google-tasks-book-1 celebration"></div>
              <div className="google-tasks-book google-tasks-book-2 celebration"></div>
              <div className="google-tasks-book google-tasks-book-3 celebration"></div>
              <div className="google-tasks-book google-tasks-book-4 celebration"></div>
            </div>
            <div className="google-tasks-shape google-tasks-square-yellow celebration"></div>
            <div className="google-tasks-shape google-tasks-circle-blue celebration"></div>
          </div>
        </div>
      </div>
      
      <h2 className="all-done-title">כל המשימות בוצעו! 🎉</h2>
      <p className="all-done-sub">
        מעולה! השלמת את כל המשימות ב{listName}
      </p>
    </div>
  );
};

export default AllDoneCard;