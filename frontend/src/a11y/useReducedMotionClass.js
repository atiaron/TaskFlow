import { useEffect } from 'react';

export function useReducedMotionClass(rootSelector = '.google-tasks-wrapper') {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const root = document.querySelector(rootSelector);
    if (!root) return;
    const apply = () => { root.classList.toggle('reduce-motion', mq.matches); };
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, [rootSelector]);
}
