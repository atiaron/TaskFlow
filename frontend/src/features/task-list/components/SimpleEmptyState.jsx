// src/features/task-list/components/SimpleEmptyState.jsx
import React from 'react';
import { useComposer } from '../../../context/ComposerContext';

export default function SimpleEmptyState() {
  const { openComposer } = useComposer();
  return (
    <div className="state-empty" style={{textAlign:'center'}}>
      <h2 style={{marginTop:0}}>בואו נתחיל</h2>
      <p style={{color:'var(--color-text-secondary)'}}>צרו את המשימה הראשונה שלכם כדי להתחיל לעבוד.</p>
      <button
        className="fab-button"
        style={{position:'static',borderRadius:24,width:'auto',padding:'0 var(--space-lg)'}}
        onClick={openComposer}
      >
        הוספת משימה חדשה
      </button>
    </div>
  );
}
