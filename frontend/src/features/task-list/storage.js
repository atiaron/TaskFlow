// src/features/task-list/storage.js
export const STORAGE_KEY = 'taskflow_tasks';
export const PROFILE_KEY = 'taskflow_profile';

function normalize(raw) {
  if (!raw) return null;
  const now = Date.now();
  return {
    id: raw.id || String(now),
    title: (raw.title ?? raw.text ?? '').trim(),
    completed: !!raw.completed,
    starred: !!raw.starred,
    createdAt: raw.createdAt || now,
    updatedAt: now,
    order: raw.order ?? now,
  };
}

function migrateLegacy() {
  try {
    const legacy = localStorage.getItem('tasks'); // ישן
    if (legacy) {
      const parsed = JSON.parse(legacy) || [];
      const migrated = parsed.map(normalize).filter(Boolean);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem('tasks');
    }
  } catch {}
}

export function ensureProfile() {
  if (!localStorage.getItem(PROFILE_KEY)) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ firstRun: Date.now(), name: 'Me' }));
  }
}

export function loadTasks() {
  migrateLegacy();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return (raw || []).map(normalize).filter(t => t && t.title);
  } catch {
    return [];
  }
}

export function saveTasks(tasks) {
  const safe = (tasks || []).map(t => ({
    id: t.id, title: t.title, completed: !!t.completed, starred: !!t.starred,
    createdAt: t.createdAt || Date.now(),
    updatedAt: Date.now(),
    order: t.order ?? Date.now(),
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}