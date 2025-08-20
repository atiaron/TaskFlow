import React from "react";

/**
 * EmptyStateCard — כרטיס מצב ריק בסגנון Google Tasks
 * Props:
 *  - title?: string (ברירת מחדל "המשימות שלי")
 *  - description?: string (טקסט עזר)
 *  - onMenu?: () => void
 *  - onSort?: () => void
 */
export default function EmptyStateCard({
  title = "המשימות שלי",
  description = "לכאן אפשר להוסיף את\nהמשימות שלך ב-Google Workspace ולעקוב אחריהן\nבקלות",
  onMenu = () => {},
  onSort = () => {},
}) {
  return (
    <section className="gt-empty" aria-label="מצב ריק">
      <div className="gt-card" role="region">
        <div className="gt-card-actions" aria-label="פעולות כרטיס">
          <button
            type="button"
            className="gt-icon-btn"
            aria-label="תפריט"
            onClick={onMenu}
          >
            ⋮
          </button>
          <button
            type="button"
            className="gt-icon-btn"
            aria-label="מיון"
            onClick={onSort}
            title="מיון"
          >
            ↕
          </button>
        </div>

        <h2 className="gt-card-title">{title}</h2>

        {/* אילוסטרציה עדינה — בלוק גרדיאנט */}
        <div className="gt-illustration" aria-hidden />

        <div className="gt-empty-title">אין עדיין אף משימה</div>
        <p className="gt-empty-desc">{description}</p>
      </div>
    </section>
  );
}
