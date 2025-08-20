// Simple performance marker helpers (no-op if Performance API missing)
export function mark(name) {
  if (typeof performance !== 'undefined' && performance.mark) {
    try { performance.mark(name); } catch {}
  }
}
export function measure(name, start, end) {
  if (typeof performance !== 'undefined' && performance.measure) {
    try { performance.measure(name, start, end); } catch {}
  }
}
export function logMeasures(filterPrefix) {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) return [];
  const entries = performance.getEntriesByType('measure');
  const filtered = filterPrefix ? entries.filter(e => e.name.startsWith(filterPrefix)) : entries;
  // eslint-disable-next-line no-console
  console.table(filtered.map(e => ({ name: e.name, duration: e.duration.toFixed(2) })));
  return filtered;
}
