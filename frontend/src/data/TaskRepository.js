// TaskRepository abstraction with LocalStorage adapter.

/** @typedef {any} Task */

/**
 * @typedef {Object} TaskRepository
 * @property {() => Promise<Task[]>} list
 * @property {(partial: Partial<Task>) => Promise<Task>} create
 * @property {(id: string, patch: Partial<Task>) => Promise<Task>} update
 * @property {(id: string) => Promise<void>} remove
 */

const LS_KEY = 'gt_tasks';
function readLS(){ try { return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); } catch { return []; } }
function writeLS(arr){ localStorage.setItem(LS_KEY, JSON.stringify(arr)); }

export class LocalStorageTaskRepository {
  async list(){
    return readLS();
  }
  async create(partial){
    const now = new Date().toISOString();
    const t = {
      id: crypto.randomUUID(),
      title: String(partial.title || '').trim(),
      description: partial.description || '',
      isCompleted: !!partial.isCompleted,
      isStarred: !!partial.isStarred,
      reminderAt: partial.reminderAt ?? null,
      completedAt: partial.completedAt ?? null,
      priority: partial.priority ?? null,
      tags: partial.tags ?? [],
      createdAt: partial.createdAt || now,
      updatedAt: now,
      sortKey: partial.sortKey ?? null
    };
    const all = readLS();
    all.unshift(t);
    writeLS(all);
    return t;
  }
  async update(id, patch){
    const all = readLS();
    const i = all.findIndex(t => t.id === id);
    if (i < 0) throw new Error('Task not found');
    const updated = { ...all[i], ...patch, updatedAt: new Date().toISOString() };
    all[i] = updated;
    writeLS(all);
    return updated;
  }
  async remove(id){
    writeLS(readLS().filter(t => t.id !== id));
  }
}
