/**
 * Unified task sort selector.
 * Priority: sortKey asc (only when both tasks have numeric sortKey) → createdAt (desc default) → id tie-break.
 * @param {Array<any>} tasks
 * @param {{direction?:'asc'|'desc'}} [opts]
 * @returns {Array<any>} new sorted array
 */
export function sortTasks(tasks, { direction='desc' } = {}) {
  const arr = [...(tasks || [])];
  arr.sort((a,b)=>{
    const ak = typeof a?.sortKey === 'number' ? a.sortKey : null;
    const bk = typeof b?.sortKey === 'number' ? b.sortKey : null;
    if (ak != null && bk != null && ak !== bk) return ak - bk; // manual order wins
    const at = Date.parse(a?.createdAt || 0);
    const bt = Date.parse(b?.createdAt || 0);
    if (at !== bt) return direction === 'desc' ? bt - at : at - bt;
    return String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
  });
  return arr;
}
