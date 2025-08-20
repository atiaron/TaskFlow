import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import "./empty-state-v2.css";
import { loadViews, getCurrentViewId, setCurrentViewId, createStaticView } from '../../../lib/views';

/**
 * HeaderTabs (extended) now supports dynamic views list with horizontal scroll.
 * Props (optional override):
 *  - activeViewId
 *  - onChange(viewId)
 * If not provided, component manages via localStorage (uncontrolled fallback).
 */
export default function HeaderTabs({ activeViewId, onChange, count = 0 }) {
  const [views, setViews] = useState(() => loadViews());
  const [internalActive, setInternalActive] = useState(() => getCurrentViewId());
  const active = activeViewId || internalActive;

  const containerRef = useRef(null);
  const indicatorRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => { setMounted(true); }, []);

  // poll for external changes (simple approach) - can be replaced with storage listener
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const v = loadViews();
        setViews(prev => JSON.stringify(prev) !== JSON.stringify(v) ? v : prev);
        const current = getCurrentViewId();
        setInternalActive(prev => prev !== current ? current : prev);
      } catch {}
    }, 2000);
    return () => clearInterval(id);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const indicator = indicatorRef.current;
    if (!indicator) return;
    const cont = containerRef.current;
    if (!cont) return;
    const btn = cont.querySelector(`[data-view-id="${active}"]`);
    if (btn) {
      const parentRect = cont.getBoundingClientRect();
      const rect = btn.getBoundingClientRect();
      const right = parentRect.right - rect.right;
      indicator.style.width = rect.width + 'px';
      indicator.style.transform = `translateX(-${right}px)`;
      // ensure in view
      const overflow = btn.offsetLeft - (cont.scrollLeft + cont.clientWidth - rect.width);
      if (overflow > 0) cont.scrollLeft += overflow + 16;
      if (btn.offsetLeft < cont.scrollLeft) cont.scrollLeft = btn.offsetLeft - 16;
    }
  }, [active, views, mounted, count]);

  function handleSelect(id) {
    if (onChange) onChange(id); else { setInternalActive(id); setCurrentViewId(id); }
  }
  function handleCreate() {
    const name = prompt('שם הרשימה החדשה:');
    if (!name) return;
    createStaticView(name.trim());
    setViews(loadViews());
    const id = getCurrentViewId();
    if (!onChange) setInternalActive(id); else onChange(id);
  }

  // Ensure order: star (always first / rightmost visually in RTL), 'all', then static custom, then plus
  const starView = views.find(v => v.id === 'starred');
  const allView = views.find(v => v.id === 'all');
  const staticViews = views.filter(v => v.type === 'static');
  const ordered = [starView, allView, ...staticViews].filter(Boolean);

  return (
    <div className="gt-tabs-wrapper" dir="rtl">
      <div className="gt-tabs gt-tabs-scroll" role="tablist" aria-label="רשימות" ref={containerRef}>
        {ordered.map(v => (
          <button
            key={v.id}
            data-view-id={v.id}
            role="tab"
            type="button"
            aria-selected={active === v.id}
            className={`gt-tab ${active === v.id ? 'is-active' : ''} ${v.id === 'starred' ? 'star' : 'grow'}`}
            onClick={() => handleSelect(v.id)}
            title={v.name}
          >
            {v.id === 'starred' ? '⭐' : v.name}{v.id === 'all' && count ? <span className="gt-badge">{count}</span> : null}
          </button>
        ))}
        <button role="tab" type="button" className="gt-tab new" onClick={handleCreate} aria-label="הוספת רשימה">הוספת רשימה</button>
        <span ref={indicatorRef} className="gt-tab-indicator-bar dyn" aria-hidden />
      </div>
    </div>
  );
}
