// src/lib/reminders.js
// מאוחד: Web + Native (Capacitor) עם lazy import. שומר API יציב ל-UI.

const K = { require: 'gt_require_reminder_permission', map: 'gt_reminder_map' };

let _cap = null;               // { Capacitor }
let _App = null;               // from '@capacitor/app'
let _Local = null;             // from '@capacitor/local-notifications'
let _isNative = false;

async function ensureNativeLoaded() {
  if (_cap) return;
  try {
    const core = await import('@capacitor/core');
    _cap = core;
    _isNative = !!core.Capacitor?.isNativePlatform?.() && core.Capacitor.isNativePlatform();
    if (_isNative) {
      const [{ App }, { LocalNotifications }] = await Promise.all([
        import('@capacitor/app'),
        import('@capacitor/local-notifications'),
      ]);
      _App = App;
      _Local = LocalNotifications;
      try { await _Local.requestPermissions(); } catch {}
    }
  } catch {
    // נשארים במצב Web
  }
}

// ------- Persist helpers -------
function getMap() {
  try { return JSON.parse(localStorage.getItem(K.map) || '{}'); } catch { return {}; }
}
function setMap(m) {
  try { localStorage.setItem(K.map, JSON.stringify(m)); } catch {}
}

// ------- Public API -------

// מצב הרשאות
export async function getPermissionStatus() {
  await ensureNativeLoaded();
  if (_isNative && _Local) {
    try {
      const res = await _Local.checkPermissions(); // { display: 'granted' | 'denied' | 'prompt' }
      return res?.display || 'unknown';
    } catch { return 'unknown'; }
  }
  try {
    if ('Notification' in window) return Notification.permission; // 'default'|'granted'|'denied'
    return 'unsupported';
  } catch { return 'unknown'; }
}

// בקשת הרשאה
export async function requestPermission() {
  await ensureNativeLoaded();
  if (_isNative && _Local) {
    try {
      const res = await _Local.requestPermissions();
      return res?.display || 'unknown';
    } catch { return 'denied'; }
  }
  try {
    if ('Notification' in window) return await Notification.requestPermission();
    return 'unsupported';
  } catch { return 'denied'; }
}

// פתיחת הגדרות אפליקציה (Native) / ב-Web נבקש שוב הרשאה
export async function openAppSettings() {
  await ensureNativeLoaded();
  if (_isNative && _App?.openAppSettings) {
    try { await _App.openAppSettings(); } catch {}
    return;
  }
  return requestPermission();
}

// “דגל” דרישת הרשאה – כדי להציג את ה-alert עד שמאשרים
export function markReminderAttempt(){ try{ localStorage.setItem(K.require,'1'); }catch{} }
export function clearReminderRequirement(){ try{ localStorage.removeItem(K.require); }catch{} }
export function isReminderRequirementSet(){ try{ return localStorage.getItem(K.require)==='1'; }catch{ return false; } }

// אירוע חזרה לאפליקציה (Native)
export function onAppResume(cb) {
  let remove = () => {};
  (async () => {
    await ensureNativeLoaded();
    if (_isNative && _App?.addListener) {
      const h = await _App.addListener('resume', cb);
      remove = () => { try { h.remove(); } catch {} };
    }
  })();
  return () => remove();
}

// שילוב תאריך+שעה לאובייקט Date
export function combineDateTime(date, time) {
  const d = new Date(date);
  if (time && /^\d{1,2}:\d{2}$/.test(time)) {
    const [hh, mm] = time.split(':').map(Number);
    d.setHours(hh, mm, 0, 0);
  }
  return d;
}

// ביטול התראה קודמת של משימה
export async function cancelReminderForTask(taskId) {
  await ensureNativeLoaded();
  const map = getMap();
  const id = map[taskId];
  if (!id) return false;
  if (_isNative && _Local) {
    try { await _Local.cancel({ notifications: [{ id }] }); } catch {}
  }
  delete map[taskId];
  setMap(map);
  return true;
}

// תזמון התראה – True אם נתזמן נייטיב, False אם לא (Web בלי SW ייעודי)
export async function scheduleReminderIfPossible({ taskId, title, at }) {
  await ensureNativeLoaded();
  if (_isNative && _Local) {
    // ביטול ישן אם קיים
    await cancelReminderForTask(taskId);
    const when = (at instanceof Date) ? at : new Date(at);
    const id = Math.abs((taskId + '').split('').reduce((a,c)=>((a<<5)-a + c.charCodeAt(0))|0, 0)); // hash יציב
    try {
      await _Local.schedule({
        notifications: [{
          id,
          title: title || 'תזכורת',
          body: 'הגיע הזמן למשימה שלך',
          schedule: { at: when, allowWhileIdle: true },
          channelId: 'taskflow-default',
          smallIcon: 'ic_stat_name',
        }]
      });
      const map = getMap(); map[taskId] = id; setMap(map);
      return true;
    } catch { return false; }
  }
  // Web רגיל: לא נתזמן OS Notification בלי SW – מחזירים false
  return false;
}
