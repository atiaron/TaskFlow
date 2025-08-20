// Schedules dynamic imports during browser idle time (with fallback timeout)
export function idlePrefetch(importer) {
  const run = () => {
    try { importer().catch(() => {}); } catch {}
  };
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 2500 });
  } else {
    setTimeout(run, 1200);
  }
}
