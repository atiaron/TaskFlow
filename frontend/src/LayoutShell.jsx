// src/LayoutShell.jsx
import React from 'react';

export default function LayoutShell({ header, filters, children, actions }) {
  return (
    <div className="layout-shell" dir="rtl">
      <a href="#main" className="skip-link">דלג לתוכן</a>
      <header className="layout-header" role="banner">
        <div className="layout-header-row">
          <div className="layout-brand">TaskFlow</div>
          {filters && <nav className="layout-filters" aria-label="סינון משימות">{filters}</nav>}
          <div className="layout-spacer" />
          {actions && <div className="layout-header-actions">{actions}</div>}
        </div>
        {header && <div className="layout-subhead">{header}</div>}
      </header>
      <main id="main" className="layout-content" role="main">
        {children}
      </main>
    </div>
  );
}
