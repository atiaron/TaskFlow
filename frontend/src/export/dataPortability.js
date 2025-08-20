import { kv } from '../storage/kvStore';

const NS = 'tf__';
const SCHEMA_KEY = `${NS}schema_v`;
const APP = 'TaskFlow';

function nowIso() { return new Date().toISOString(); }
function filename(ts = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  const y = ts.getFullYear(), m = pad(ts.getMonth()+1), d = pad(ts.getDate());
  const hh = pad(ts.getHours()), mm = pad(ts.getMinutes());
  return `TaskFlow-backup-${y}${m}${d}-${hh}${mm}.json`;
}

export function collectNamespace(prefix = NS) {
  const out = {};
  const keys = kv.list(prefix);
  keys.forEach(k => {
    const v = kv.get(k);
    if (v != null) out[k] = v;
  });
  return out;
}

export function buildBackupObject() {
  const data = collectNamespace(NS);
  const schemaVersion = kv.get(SCHEMA_KEY) || '1';
  const meta = { app: APP, schemaVersion, exportedAt: nowIso(), count: Object.keys(data).length };
  return { meta, data };
}

export function exportData(triggerDownload = true) {
  const obj = buildBackupObject();
  if (triggerDownload && typeof document !== 'undefined') {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename();
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  return obj;
}

export async function importData(fileOrObject, opts = {}) {
  const strategy = opts.strategy || 'merge'; // merge | replace
  const dryRun = !!opts.dryRun;
  let backup = null;
  if (typeof File !== 'undefined' && fileOrObject instanceof File) {
    const text = await fileOrObject.text();
    backup = JSON.parse(text);
  } else if (typeof fileOrObject === 'string') {
    backup = JSON.parse(fileOrObject);
  } else {
    backup = fileOrObject;
  }
  if (!backup || !backup.meta || !backup.data || typeof backup.data !== 'object') {
    throw new Error('קובץ גיבוי לא תקין');
  }
  if (backup.meta.app !== APP) throw new Error('קובץ גיבוי אינו מתאים לאפליקציה זו');

  const entries = Object.entries(backup.data).filter(([k]) => k.startsWith(NS));
  const report = { applied: 0, skipped: 0, replacedAll: false, total: entries.length };

  if (strategy === 'replace') {
    report.replacedAll = true;
    if (!dryRun) kv.list(NS).forEach(k => kv.remove(k));
  }
  for (const [k, v] of entries) {
    if (typeof v !== 'string') { report.skipped++; continue; }
    if (!dryRun) kv.set(k, v);
    report.applied++;
  }
  if (!dryRun && backup.meta.schemaVersion) kv.set(SCHEMA_KEY, backup.meta.schemaVersion);
  return report;
}
