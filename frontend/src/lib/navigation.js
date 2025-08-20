// Minimal hash/query based navigation
// Route shapes:
// { type: 'view', id }
// { type: 'screen', name: 'allCompleted' }

const KEY = 'gt_current_view';

export function getInitialRoute(){
  try {
    const url = new URL(window.location.href);
    const byQuery = url.searchParams.get('view');
    const byHash = url.hash && url.hash.startsWith('#/v/') ? url.hash.slice(4) : null;
    const id = byQuery || byHash || localStorage.getItem(KEY) || 'all';
    return { type: 'view', id };
  } catch {
    return { type: 'view', id: 'all' };
  }
}

export function navigateToView(id){
  try { localStorage.setItem(KEY, id); } catch {}
  const next = `#/v/${id}`;
  if (window.location.hash !== next) window.location.hash = next;
}

export function parseHash(){
  const h = window.location.hash;
  if (h.startsWith('#/v/')) return { type: 'view', id: h.slice(4) };
  if (h === '#/completed') return { type: 'screen', name: 'allCompleted' };
  return null;
}
