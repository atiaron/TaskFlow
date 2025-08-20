// Task indexing with WeakMap cache keyed by array reference.
// Provides O(n) build once per tasks array identity, O(1)/O(k) selectors downstream.

/**
 * @typedef {Object} TaskIndex
 * @property {Map<string, any>} byId
 * @property {string[]} ids
 * @property {string[]} activeIds
 * @property {string[]} completedIds
 * @property {string[]} starredActiveIds
 * @property {string[]} unstarredActiveIds
 */

const cache = new WeakMap();

/**
 * Build or fetch cached index for a tasks array.
 * @param {any[]} tasks
 * @returns {TaskIndex}
 */
export function indexTasks(tasks){
  const hit = cache.get(tasks);
  if (hit) return hit;
  const byId = new Map();
  const ids = []; const activeIds = []; const completedIds = [];
  const starredActiveIds = []; const unstarredActiveIds = [];
  for (const t of tasks){
    if (!t || !t.id) continue;
    ids.push(t.id); byId.set(t.id, t);
    const isCompleted = !!(t.isCompleted || t.completed || t.completedAt);
    if (isCompleted) completedIds.push(t.id); else {
      activeIds.push(t.id);
      (t.isStarred || t.starred ? starredActiveIds : unstarredActiveIds).push(t.id);
    }
  }
  const idx = { byId, ids, activeIds, completedIds, starredActiveIds, unstarredActiveIds };
  cache.set(tasks, idx);
  return idx;
}
