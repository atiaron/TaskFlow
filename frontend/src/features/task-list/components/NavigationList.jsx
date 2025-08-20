import React, { useCallback } from 'react';
import clsx from 'clsx';
import { createStaticView, loadViews, renameView, removeView } from '../../../lib/views';

/**
 * NavigationList - dynamic saved views navigation replacing HeaderTabs.
 * Uncontrolled (self manages its state via localStorage helpers) to minimize invasive changes.
 * Could be refactored later to accept props for controlled mode.
 */
export default function NavigationList({ views, currentViewId, onSelect, onViewsChanged }) {
  const onCreate = useCallback(() => {
    const name = prompt('שם הרשימה החדשה:');
    if (!name) return;
    createStaticView(name.trim());
    onViewsChanged(loadViews());
  }, [onViewsChanged]);

  const onRename = useCallback((id) => {
    const v = views.find(x => x.id === id);
    const name = prompt('שם חדש:', v?.name || '');
    if (!name) return;
    renameView(id, name.trim());
    onViewsChanged(loadViews());
  }, [views, onViewsChanged]);

  const onRemove = useCallback((id) => {
    if (!window.confirm('למחוק רשימה זו? (לא תמחק משימות)')) return;
    removeView(id);
    onViewsChanged(loadViews());
    if (currentViewId === id) onSelect('all');
  }, [onViewsChanged, onSelect, currentViewId]);

  return (
    <div className="gt-navList" role="tablist" aria-label="רשימות" dir="rtl">
      {views.map(v => (
        <button key={v.id}
          role="tab"
            type="button"
          aria-selected={currentViewId === v.id}
          className={clsx('gt-navItem', {
            'is-active': currentViewId === v.id,
            'is-default': v.type === 'rule'
          })}
          onClick={() => onSelect(v.id)}
          onContextMenu={(e) => { e.preventDefault(); if (v.type !== 'rule') onRename(v.id); }}
          onAuxClick={(e) => { if (e.button === 1 && v.type !== 'rule') onRemove(v.id); }}
          title={v.type === 'rule' ? undefined : 'קליק ימני לשינוי שם, אמצעי למחיקה'}>
          <span className="gt-navItem__label">{v.name}</span>
        </button>
      ))}
      <button type="button" className="gt-navItem gt-navItem--add" onClick={onCreate} aria-label="רשימה חדשה">+</button>
    </div>
  );
}
