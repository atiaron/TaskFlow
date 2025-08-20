import { useCallback, useEffect, useState } from 'react';

const KEY = 'gt_expanded_map';

function loadMap() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; }
}
function saveMap(map) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch {}
}

/**
 * Persisted expanded state per task id.
 * Returns [expanded:boolean, toggle:fn]
 */
export function useExpanded(taskId) {
  const [expanded, setExpanded] = useState(() => !!loadMap()[taskId]);
  useEffect(() => {
    if (!taskId) return;
    const map = loadMap();
    if (expanded) {
      map[taskId] = true;
    } else {
      delete map[taskId];
    }
    saveMap(map);
  }, [taskId, expanded]);
  const toggle = useCallback(() => setExpanded(v => !v), []);
  return [expanded, toggle];
}
