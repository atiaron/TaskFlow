const NS = 'tf__';
const VER_KEY = `${NS}schema_v`;
const VER = '1';

export const kv = {
  version() { return VER; },
  key(k: string) { return k.startsWith(NS) ? k : `${NS}${k}`; },
  get(k: string) { try { return localStorage.getItem(kv.key(k)); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(kv.key(k), v); } catch {} },
  remove(k: string) { try { localStorage.removeItem(kv.key(k)); } catch {} },
  getJSON<T = any>(k: string): T | null {
    const v = kv.get(k); if (v == null) return null; try { return JSON.parse(v) as T; } catch { return null; }
  },
  setJSON(k: string, v: any) { kv.set(k, JSON.stringify(v)); },
  list(prefix = NS) {
    const out: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)!; if (key && key.startsWith(prefix)) out.push(key);
      }
    } catch {}
    return out;
  },
  ensureVersion() { try { if (localStorage.getItem(VER_KEY) !== VER) localStorage.setItem(VER_KEY, VER); } catch {} }
};
kv.ensureVersion();

/** Soft migrate an old localStorage key to new namespaced key (keeps old). */
export function migrateLegacyKey(oldKey: string, newKey: string) {
  try {
    const existsNew = localStorage.getItem(newKey);
    if (existsNew != null) return;
    const v = localStorage.getItem(oldKey);
    if (v != null) localStorage.setItem(newKey, v);
  } catch {}
}
