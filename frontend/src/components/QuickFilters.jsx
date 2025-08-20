// Segmented quick filter tabs
import React from 'react';

const FILTERS = [
  { key: 'all', label: 'הכל' },
  { key: 'active', label: 'פעילות' },
  { key: 'completed', label: 'הושלמו' },
  { key: 'starred', label: 'כוכב' },
];

export default function QuickFilters({ value, onChange }) {
  return (
    <div className="filters-bar" role="tablist" aria-label="סינון משימות">
      {FILTERS.map(f => (
        <button
          key={f.key}
          role="tab"
          aria-selected={value === f.key}
          className={`filter-chip ${value === f.key ? 'active' : ''}`}
          onClick={() => onChange(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
