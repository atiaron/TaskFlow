/**
 * Migration 1.3 – remove legacy 'order', ensure createdAt/updatedAt, set sortKey null if absent.
 * Preserves visual order as previously stored.
 * @param {Array<any>} rawTasks
 * @returns {Array<any>} migrated clone
 */
export function migrateOrderToCreatedAt(rawTasks){
  const tasks = Array.isArray(rawTasks) ? rawTasks.map(t=>({...t})) : [];
  if (!tasks.length) return tasks;
  const needs = tasks.some(t => 'order' in t || !t.createdAt);
  if (!needs) return tasks;
  // Sort by explicit order asc if both have, else presence of order, else existing createdAt asc
  tasks.sort((a,b)=>{
    const ao = a.order ?? null; const bo = b.order ?? null;
    if (ao != null && bo != null && ao !== bo) return ao - bo;
    if (ao != null && bo == null) return -1;
    if (bo != null && ao == null) return 1;
    const at = Date.parse(a.createdAt || 0); const bt = Date.parse(b.createdAt || 0);
    return at - bt;
  });
  const base = Date.now() - tasks.length * 1000;
  let i=0;
  for (const t of tasks){
    if (!t.createdAt) t.createdAt = new Date(base + i*1000).toISOString();
    if (!t.updatedAt) t.updatedAt = t.createdAt;
    if ('order' in t) delete t.order;
    if (typeof t.sortKey !== 'number') t.sortKey = null;
    i++;
  }
  return tasks;
}
