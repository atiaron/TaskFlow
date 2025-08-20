// src/features/starred/StarredList.jsx
import React from "react";
import TaskRow from "../task-list/components/TaskRow"; // התאמת הנתיב לרכיב TaskRow הקיים
import StarredEmptyCard from "../task-list/components/StarredEmptyCard";

export default function StarredList({
  tasks = [],
  onToggleStar,
  onToggleComplete,
  onOpenMenu,
}) {
  return (
    <section className="gt-list-card starred" aria-label="מסומנות בכוכב">
      <header className="gt-list-header">
        <button
          className="gt-icon menu-dots"
          aria-label="תפריט רשימה"
          onClick={onOpenMenu}
          type="button"
        >
          ⋮
        </button>
        <h2 className="gt-list-title">מסומנת בכוכב</h2>
        <button className="gt-icon sort-arrows" aria-label="מיון" type="button">
          ↕
        </button>
      </header>

      <div className="gt-list-subtitle">סומנו בכוכב לאחרונה</div>

      {tasks.length === 0 ? (
        <StarredEmptyCard />
      ) : (
        <div className="gt-list-body" role="list">
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggleStar={() => onToggleStar?.(t.id)}
              onToggleComplete={() => onToggleComplete?.(t.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
