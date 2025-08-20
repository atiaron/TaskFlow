// src/components/DataState.jsx
import React from 'react';

export default function DataState({ status, empty, error, loading, children }) {
  if (status === 'loading') return loading || (
    <div className="state-loading" aria-busy="true">
      <div className="skeleton-list">
        {Array.from({length:5}).map((_,i)=>(
          <div className="skeleton-row" key={i} />
        ))}
      </div>
    </div>
  );
  if (status === 'error') return error || <div className="state-error" role="alert">שגיאה בטעינה</div>;
  if (status === 'empty') return empty || <div className="state-empty">אין נתונים</div>;
  return <>{children}</>;
}
