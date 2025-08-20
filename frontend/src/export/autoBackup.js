import { kv } from '../storage/kvStore';
import { buildBackupObject } from './dataPortability';

const NS = 'tf__';
const BACKUP_PREFIX = `${NS}backup_`;
const LAST_KEY = `${NS}backup_last`;
const DEFAULT_INTERVAL_DAYS = 7;
const KEEP = 3;

function stamp(date = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  const y = date.getFullYear(), m = pad(date.getMonth()+1), d = pad(date.getDate());
  const hh = pad(date.getHours()), mm = pad(date.getMinutes());
  return `${y}${m}${d}-${hh}${mm}`;
}

function isoToDate(s) {
  const [ymd, hm] = s.split('-');
  const y = +ymd.slice(0,4), m = +ymd.slice(4,6)-1, d = +ymd.slice(6,8);
  const hh = +hm.slice(0,2), mm = +hm.slice(2,4);
  return new Date(y, m, d, hh, mm);
}

export function listBackups() {
  return kv.list(BACKUP_PREFIX).map(k => {
    const iso = k.slice(BACKUP_PREFIX.length);
    return { key: k, stamp: iso, date: isoToDate(iso) };
  }).sort((a,b) => b.key.localeCompare(a.key));
}

export function createSnapshot() {
  const snap = buildBackupObject();
  const key = `${BACKUP_PREFIX}${stamp()}`;
  kv.set(key, JSON.stringify(snap));
  kv.set(LAST_KEY, new Date().toISOString());
  pruneBackups(KEEP);
  return { key, count: snap.meta.count };
}

export function pruneBackups(keep = KEEP) {
  const all = listBackups();
  const toRemove = all.slice(keep);
  toRemove.forEach(b => kv.remove(b.key));
  return { removed: toRemove.length };
}

export function maybeRunAutoBackup({ intervalDays = DEFAULT_INTERVAL_DAYS, keep = KEEP } = {}) {
  try {
    const lastIso = kv.get(LAST_KEY);
    const last = lastIso ? new Date(lastIso).getTime() : 0;
    const now = Date.now();
    const ms = intervalDays * 24 * 60 * 60 * 1000;
    if (now - last >= ms) {
      const res = createSnapshot();
      pruneBackups(keep);
      return { ran: true, res };
    }
  } catch {}
  return { ran: false };
}

export function restoreBackup(key, { dryRun = false } = {}) {
  const str = kv.get(key);
  if (!str) throw new Error('גיבוי לא נמצא');
  const obj = JSON.parse(str);
  return import('./dataPortability').then(({ importData }) =>
    importData(obj, { strategy: 'replace', dryRun })
  );
}
