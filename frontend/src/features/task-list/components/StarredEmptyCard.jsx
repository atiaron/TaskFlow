// src/features/task-list/components/StarredEmptyCard.jsx
import React from "react";

export default function StarredEmptyCard() {
  return (
    <section
      className="gt-list-card gt-empty-starred"
      aria-label="מצב ריק - מסומנת בכוכב"
    >
      <header className="gt-list-header">
        <h2 className="gt-list-title">מסומנת בכוכב</h2>
      </header>

      <div className="gt-empty-body">
        <div className="gt-empty-illus" aria-hidden="true">⭐</div>

        <h3 className="gt-empty-title">אין אף משימה שמסומנת בכוכב</h3>

        <p className="gt-empty-desc">
          אפשר לסמן משימות חשובות בכוכב כדי למצוא אותן כאן בקלות
        </p>
      </div>
    </section>
  );
}
