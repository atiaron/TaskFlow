import { useEffect, useRef } from 'react';

// Simple focus trap + restore hook
export function useFocusTrap(containerRef, { active, initialFocus = null, returnFocusTo = null } = {}) {
  const prevFocused = useRef(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || !active) return;
    prevFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const selector = [
      'a[href]','button:not([disabled])','input:not([disabled])','select:not([disabled])',
      'textarea:not([disabled])','[tabindex]:not([tabindex="-1"])','[role="button"]'
    ].join(',');
    const getNodes = () => Array.from(root.querySelectorAll(selector))
      .filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

    const first = initialFocus || getNodes()[0] || root;
    try { first && first.focus(); } catch {}

    const onKey = (e) => {
      if (e.key === 'Escape') return; // letting parent handle escape if needed
      if (e.key !== 'Tab') return;
      const nodes = getNodes(); if (!nodes.length) { e.preventDefault(); return; }
      const firstNode = nodes[0]; const lastNode = nodes[nodes.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey && (activeEl === firstNode || !root.contains(activeEl))) {
        e.preventDefault(); lastNode.focus();
      } else if (!e.shiftKey && activeEl === lastNode) {
        e.preventDefault(); firstNode.focus();
      }
    };
    const onFocusIn = (e) => {
      if (!root.contains(e.target)) {
        const nodes = getNodes(); (nodes[0] || root).focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', onFocusIn, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocusIn, true);
      const ret = returnFocusTo || prevFocused.current;
      try { ret && ret.focus(); } catch {}
      prevFocused.current = null;
    };
  }, [containerRef, active, initialFocus, returnFocusTo]);
}
