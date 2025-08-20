// Lightweight metrics placeholders.
// Replace implementations with real analytics (e.g., PostHog, Amplitude, custom backend) later.

const counters = {
  tasksCreated: 0,
  tasksCompleted: 0,
  tasksUncompleted: 0,
  starsToggledOn: 0,
  starsToggledOff: 0,
  clearCompleted: 0,
  undoClear: 0,
  editsCommitted: 0,
  filtersChanged: 0,
};

let firstTaskAt = null; // timestamp of first task creation in session

function inc(key) { if (Object.prototype.hasOwnProperty.call(counters, key)) counters[key]++; }

export const metrics = {
  counters,
  trackTaskCreated() { inc('tasksCreated'); },
  trackToggleComplete(completed) { inc(completed ? 'tasksCompleted' : 'tasksUncompleted'); },
  trackToggleStar(on) { inc(on ? 'starsToggledOn' : 'starsToggledOff'); },
  trackClearCompleted() { inc('clearCompleted'); },
  trackUndoClear() { inc('undoClear'); },
  trackEditCommit() { inc('editsCommitted'); },
  trackFilterChange() { inc('filtersChanged'); },
  markFirstTask(now = performance?.now?.() ?? Date.now()) { if (!firstTaskAt) firstTaskAt = now; },
  snapshot() { return { ...counters }; },
  firstTaskAt() { return firstTaskAt; },
  reset() { Object.keys(counters).forEach(k => counters[k] = 0); firstTaskAt = null; }
};
