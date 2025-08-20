// Performance marks and Long Task observer
import { logPerf } from './errorReporter';

export function mark(name) {
  try { performance.mark(name); } catch {}
}

export function measure(name, start, end) {
  try {
    if (end) performance.mark(end);
    const m = performance.measure(name, start, end);
    logPerf(`measure:${name}`, { duration: m.duration });
    return m.duration;
  } catch { return 0; }
}

export function markInteractive() {
  mark('app_interactive');
  measure('tti', 'app_start', 'app_interactive');
}

export function observeLongTasks() {
  try {
    const ob = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        logPerf('longtask', { duration: entry.duration, name: entry.name });
      }
    });
    ob.observe({ entryTypes: ['longtask'] });
  } catch {}
}
