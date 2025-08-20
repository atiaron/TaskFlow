import { useCallback } from 'react';

/**
 * useOneShotAnim
 * Adds a transient CSS class (e.g. 'is-animating') to an element to trigger
 * a keyframe animation, removing it automatically on animationend or after
 * a fallback timeout. Safe for rapid re-clicks (restarts animation if class removed).
 */
export function useOneShotAnim() {
  return useCallback((el, className = 'is-animating', ms = 450) => {
    if (!el) return;
    // If already animating, force reflow to restart
    if (el.classList.contains(className)) {
      el.classList.remove(className);
      // force reflow
      // eslint-disable-next-line no-unused-expressions
      void el.offsetWidth;
    }
    el.classList.add(className);
    const done = () => {
      el.classList.remove(className);
      el.removeEventListener('animationend', done);
    };
    el.addEventListener('animationend', done, { once: true });
    // Fallback safety removal
    window.setTimeout(done, ms + 80);
  }, []);
}
