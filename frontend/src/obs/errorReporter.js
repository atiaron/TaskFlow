// Lightweight error & event reporter
// Collects window errors + unhandled rejections into an in-memory (and persisted) ring buffer.
// Optional flush to remote endpoint stored in kv key tf__obs_endpoint
import { kv } from '../storage/kvStore';

/** @typedef {Object} LogEvent
 *  @property {number} ts
 *  @property {'error'|'unhandledrejection'|'warn'|'info'|'perf'} type
 *  @property {string} msg
 *  @property {string=} stack
 *  @property {any=} data
 */

const Q = []; // ring buffer
const MAX = 200;
const LS_KEY = 'tf__obs_buffer';
const ENDPOINT_KEY = 'tf__obs_endpoint';
const USER_KEY = 'tf__user_id';

function persist() {
  try { kv.set(LS_KEY, JSON.stringify(Q)); } catch {}
}

function push(e) {
  Q.push(e);
  if (Q.length > MAX) Q.shift();
  persist();
}

export function logInfo(msg, data) { push({ ts: Date.now(), type: 'info', msg, data }); }
export function logWarn(msg, data) { push({ ts: Date.now(), type: 'warn', msg, data }); }
export function logPerf(msg, data) { push({ ts: Date.now(), type: 'perf', msg, data }); }

export function initErrorReporter() {
  // revive previous buffer
  const prev = kv.get(LS_KEY);
  if (prev) {
    try {
      const arr = JSON.parse(prev);
      if (Array.isArray(arr)) { arr.forEach(ev => Q.push(ev)); }
    } catch {}
  }

  window.addEventListener('error', (e) => {
    push({ ts: Date.now(), type: 'error', msg: String(e.message || 'Error'), stack: e.error?.stack || `${e.filename}:${e.lineno}`, data: { filename: e.filename, lineno: e.lineno, colno: e.colno } });
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e && e.reason;
    push({ ts: Date.now(), type: 'unhandledrejection', msg: String(reason?.message || reason), stack: reason?.stack });
  });

  const tryFlush = async () => {
    const url = kv.get(ENDPOINT_KEY);
    if (!url || !Q.length) return;
    const user = kv.get(USER_KEY) || kv.get('tf__device_id') || 'anon';
    const payload = { user, events: Q.slice() };
    try {
      await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      Q.length = 0;
      persist();
    } catch {
      // keep buffer
    }
  };

  const idle = (cb) => ('requestIdleCallback' in window ? window.requestIdleCallback(cb) : setTimeout(cb, 1000));
  idle(tryFlush);
  window.addEventListener('beforeunload', () => {
    const url = kv.get(ENDPOINT_KEY);
    if (url && navigator.sendBeacon) {
      const user = kv.get(USER_KEY) || kv.get('tf__device_id') || 'anon';
      try { navigator.sendBeacon(url, new Blob([JSON.stringify({ user, events: Q })], { type: 'application/json' })); } catch {}
    }
  });
}

export function getBuffer() { return Q.slice(); }
