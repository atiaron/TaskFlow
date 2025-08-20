// frontend/src/lib/views.js
// Layer providing dynamic "views" (saved lists) without mutating task schema.
// Stores: views (custom + merged defaults), listMap (taskId -> static viewId), currentViewId.

export const VIEWS_KEY = 'gt_views';
export const MAP_KEY   = 'gt_list_map';
export const CUR_KEY   = 'gt_current_view';

export const DEFAULT_VIEWS = [
  { id: 'all',       name: 'המשימות שלי',     type: 'rule',  rule: { kind: 'all' } },
  { id: 'starred',   name: 'מועדפים',          type: 'rule',  rule: { kind: 'starred' } }
];

const uid = () => 'v_' + Math.random().toString(36).slice(2, 9);

export function loadViews() {
  try {
    const raw = JSON.parse(localStorage.getItem(VIEWS_KEY) || '[]');
    const baseIds = new Set(DEFAULT_VIEWS.map(v => v.id));
    const user = (raw || []).filter(v => !baseIds.has(v.id));
    return [...DEFAULT_VIEWS, ...user];
  } catch { return [...DEFAULT_VIEWS]; }
}
export function saveViews(views) {
  const baseIds = new Set(DEFAULT_VIEWS.map(v => v.id));
  const userOnly = views.filter(v => !baseIds.has(v.id));
  try { localStorage.setItem(VIEWS_KEY, JSON.stringify(userOnly)); } catch {}
}

export function loadListMap() {
  try { return JSON.parse(localStorage.getItem(MAP_KEY) || '{}') || {}; } catch { return {}; }
}
export function saveListMap(map) {
  try { localStorage.setItem(MAP_KEY, JSON.stringify(map)); } catch {}
}

export function getCurrentViewId() {
  return localStorage.getItem(CUR_KEY) || 'all';
}
export function setCurrentViewId(id) { try { localStorage.setItem(CUR_KEY, id); } catch {} }

export function createStaticView(name) {
  const v = { id: uid(), name, type: 'static' };
  const views = loadViews(); views.push(v); saveViews(views); setCurrentViewId(v.id);
  return v;
}
export function renameView(id, name) {
  const views = loadViews().map(v => v.id === id ? { ...v, name } : v);
  saveViews(views); return views;
}
export function removeView(id) {
  if (DEFAULT_VIEWS.some(v => v.id === id)) return loadViews();
  const views = loadViews().filter(v => v.id !== id);
  const map = loadListMap();
  for (const k of Object.keys(map)) if (map[k] === id) delete map[k];
  saveViews(views); saveListMap(map);
  if (getCurrentViewId() === id) setCurrentViewId('all');
  return views;
}

export function assignTaskToView(taskId, viewId) {
  const view = loadViews().find(v => v.id === viewId);
  if (!view || view.type !== 'static') return;
  const map = loadListMap(); map[taskId] = viewId; saveListMap(map);
}
export function unassignTask(taskId) {
  const map = loadListMap(); delete map[taskId]; saveListMap(map);
}

// Unified selector for tasks given a view
// Adjusted to existing task schema: uses task.starred, task.completed, task.dueAt (if present)
export function getTasksForView(tasks, view, now = new Date()) {
  const map = loadListMap();
  if (!view || view.id === 'all') return tasks;
  if (view.type === 'static') return tasks.filter(t => map[t.id] === view.id);

  switch (view.rule?.kind) {
    case 'starred':   return tasks.filter(t => !!t.starred && !t.completed);
    case 'completed': return tasks.filter(t => !!t.completed);
    case 'date': {
      const range = view.rule.range;
      return tasks.filter(t => {
        const d = t.dueAt ? new Date(t.dueAt) : null; // using dueAt (existing or future)
        if (!d) return false;
        if (range === 'today') return d.toDateString() === now.toDateString();
        return false;
      });
    }
    default: return tasks;
  }
}

// Utility: assign multiple tasks (bulk) - future use
export function bulkAssignTasks(taskIds, viewId) {
  const view = loadViews().find(v => v.id === viewId);
  if (!view || view.type !== 'static') return;
  const map = loadListMap();
  taskIds.forEach(id => { map[id] = viewId; });
  saveListMap(map);
}
