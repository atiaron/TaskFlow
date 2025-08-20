// Centralized namespaced key-value storage wrapper (localStorage abstraction)
// All persistence should go through this module.

const NS = 'tf__';
const VER_KEY = `${NS}schema_v`;
const VER = '1';

export const kv = {
  version() { return VER; },
  key(k) { return k.startsWith(NS) ? k : `${NS}${k}`; },
  get(k) { try { return localStorage.getItem(kv.key(k)); } catch { return null; } },
  set(k, v) { try { if (v == null) localStorage.removeItem(kv.key(k)); else localStorage.setItem(kv.key(k), v); } catch {} },
  remove(k) { try { localStorage.removeItem(kv.key(k)); } catch {} },
  getJSON(k) {
    const v = kv.get(k); if (v == null) return null; try { return JSON.parse(v); } catch { return null; }
  },
  setJSON(k, v) { try { kv.set(k, JSON.stringify(v)); } catch {} },
  list(prefix = NS) {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i); if (key && key.startsWith(prefix)) out.push(key);
      }
    } catch {}
    return out;
  },
  ensureVersion() { try { if (localStorage.getItem(VER_KEY) !== VER) localStorage.setItem(VER_KEY, VER); } catch {} }
};
kv.ensureVersion();

/**
 * Migrate an old raw key to new namespaced key (non-destructive, keeps old).
 * Call early in provider initialization code.
 */
export function migrateLegacyKey(oldKey, newKey) {
  try {
    const existsNew = localStorage.getItem(newKey);
    if (existsNew != null) return;
    const v = localStorage.getItem(oldKey);
    if (v != null) localStorage.setItem(newKey, v);
  } catch {}
}
