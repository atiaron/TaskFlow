// Feature flag gate for Modern Task Row rollout
// Resolution order:
// 1. URL query (?modernTasks=off|on|<percent 0-100>)
// 2. localStorage gt_modern_tasks (off|on|<percent>)
// 3. Env REACT_APP_MODERN_TASKS (off|on|<percent>)
// 4. Default: off
// Supports per-task deterministic bucketing for percentage rollout via stable hash.

function readQuery() {
  if (typeof window === 'undefined') return null;
  try {
    const p = new URLSearchParams(window.location.search).get('modernTasks');
    return p || null;
  } catch { return null; }
}
function readLocalStorage() {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('gt_modern_tasks'); } catch { return null; }
}
function readEnv() {
  if (typeof process !== 'undefined') {
    return process.env.REACT_APP_MODERN_TASKS || null;
  }
  return null;
}

function normalize(raw) {
  if (!raw) return null;
  const val = raw.toString().trim().toLowerCase();
  if (['on','true','1','yes','enable','enabled'].includes(val)) return 'on';
  if (['off','false','0','no','disable','disabled'].includes(val)) return 'off';
  const num = parseInt(val, 10);
  if (!isNaN(num) && num >= 0 && num <= 100) return String(num);
  return null; // invalid ignored
}

const resolvedRaw = normalize(readQuery()) || normalize(readLocalStorage()) || normalize(readEnv()) || 'off';

export function getModernTasksMode() {
  return resolvedRaw; // 'on' | 'off' | '0'-'100'
}

// Stable FNV-1a hash for percentage bucketing
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0; // unsigned
  }
  return h;
}

export function isModernTask(taskId) {
  const mode = getModernTasksMode();
  if (mode === 'on') return true;
  if (mode === 'off') return false;
  // percentage mode
  const pct = parseInt(mode, 10);
  if (isNaN(pct)) return false;
  if (!taskId) return false;
  const bucket = hash(String(taskId)) % 100; // 0..99
  return bucket < pct; // if pct=25 -> 25% tasks modern
}

export function debugModernTasksConfig() {
  return { mode: getModernTasksMode() };
}
