import React, { useRef, useState, useEffect } from 'react';
import { useFocusTrap } from '../a11y/useFocusTrap';
import { useSettings } from '../context/SettingsContext';
import { exportData, importData } from '../export/dataPortability';
import { createSnapshot, listBackups, restoreBackup, pruneBackups } from '../export/autoBackup';
import { kv } from '../storage/kvStore';
import { useToast } from '../context/ToastContext';
import { useFlags } from '../flags/FlagProvider';

/**
 * SettingsSheet (MVP)
 * - Sort Mode selection
 * - Theme Mode toggle (light/dark/system)
 * Future: density, notifications, language
 */
export default function SettingsSheet({ open, onClose }) {
  const { sortMode, setSortMode, themeMode, setThemeMode } = useSettings();
  const toast = useToast();
  const { getFlag, setFlag } = useFlags();
  const [backups, setBackups] = useState([]);
  const fileRef = useRef(null);
  useEffect(() => { if (open) setBackups(listBackups()); }, [open]);
  const sheetRef = useRef(null);
  useFocusTrap(sheetRef, { active: !!open, returnFocusTo: null });
  // Detect current system preference once for label hint (doesn't need live update here)
  const systemPref = React.useMemo(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch(e) { return 'light'; }
  }, []);
  if (!open) return null;
  return (
    <div ref={sheetRef} className="gt-sheet gt-settingsSheet" role="dialog" aria-modal="true" aria-label="הגדרות" dir="rtl">
      <header className="gt-settingsSheet__hdr">
        <h2 className="gt-settingsSheet__title">הגדרות</h2>
        <button className="gt-settingsSheet__close" onClick={onClose} aria-label="סגור">×</button>
      </header>
  <section className="gt-settingsSection">
        <h3 className="gt-settingsSection__title">מיון ברירת מחדל</h3>
        <div className="gt-radioGroup">
          {[
            { key:'manual', label:'ידני' },
            { key:'date', label:'תאריך' },
            { key:'star', label:'כוכב' },
            { key:'title', label:'כותרת' }
          ].map(opt => (
            <label key={opt.key} className="gt-radioOption">
              <input type="radio" name="sortMode" value={opt.key} checked={sortMode===opt.key} onChange={() => setSortMode(opt.key)} />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </section>
  <section className="gt-settingsSection">
        <h3 className="gt-settingsSection__title">ערכת צבע</h3>
        <div className="gt-radioGroup">
          {[
            { key:'light', label:'בהיר' },
            { key:'dark', label:'כהה' },
            { key:'system', label:`מערכת (כרגע ${systemPref==='dark' ? 'כהה' : 'בהיר'})` }
          ].map(opt => (
            <label key={opt.key} className="gt-radioOption">
              <input type="radio" name="themeMode" value={opt.key} checked={themeMode===opt.key} onChange={() => setThemeMode(opt.key)} />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </section>
      <section className="gt-settingsSection">
        <h3 className="gt-settingsSection__title">נתונים וגיבוי</h3>
        <div className="gt-settingsRow">
          <button type="button" onClick={() => { exportData(true); toast.show('ייצוא התחיל'); }}>ייצוא נתונים (JSON)</button>
          <small>מוריד קובץ JSON עם כל המפתחות (tf__*)</small>
        </div>
        <div className="gt-settingsRow">
          <input ref={fileRef} hidden type="file" accept="application/json" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            if (f.size > 2_000_000) { toast.show('קובץ גדול — ייבוא עשוי להיכשל', { isError: true }); }
            try {
              const rep = await importData(f, { strategy: 'merge' });
              toast.show(`ייבוא: הוחלו ${rep.applied}, דולגו ${rep.skipped}`);
              setBackups(listBackups());
            } catch(err){ toast.show('שגיאת ייבוא: '+(err.message||''), { isError: true }); }
            e.target.value='';
          }} />
          <button type="button" onClick={() => fileRef.current?.click()}>ייבוא נתונים…</button>
          <small>מיזוג נתונים לקיימים (לא מוחק)</small>
        </div>
        <div className="gt-settingsRow">
          <button type="button" onClick={() => { const { key, count } = createSnapshot(); toast.show(`נוצר גיבוי (${count})`); setBackups(listBackups()); }}>גיבוי עכשיו</button>
          <button type="button" onClick={() => { pruneBackups(3); setBackups(listBackups()); toast.show('נוקו גיבויים ישנים'); }}>נקה ישנים</button>
        </div>
        <div className="gt-settingsRow">
          <strong>גיבויים:</strong>
          {backups.length === 0 && <div className="gt-subtle">אין גיבויים</div>}
          <ul className="gt-backupList">
            {backups.map(b => (
              <li key={b.key} className="gt-backupItem">
                <span>גיבוי {b.stamp}</span>
                <div className="gt-backupActions">
                  <button type="button" onClick={async () => {
                    try { const rep = await restoreBackup(b.key); toast.show(`שוחזר (${rep.applied})`); }
                    catch(e){ toast.show('שגיאת שחזור', { isError:true }); }
                  }}>שחזר</button>
                  <button type="button" onClick={() => { kv.remove(b.key); setBackups(listBackups()); }}>מחק</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="gt-settingsRow">
          <button type="button" className="danger" onClick={() => {
            if (!window.confirm('למחוק את כל נתוני TaskFlow?')) return;
            kv.list('tf__').forEach(k => kv.remove(k));
            toast.show('הנתונים נוקו');
            setBackups(listBackups());
          }}>נקה את כל הנתונים</button>
        </div>
      </section>
      <section className="gt-settingsSection">
        <h3 className="gt-settingsSection__title">דגלים (Dev)</h3>
        <div className="gt-settingsRow">
          <label>צפיפות ברירת מחדל:
            <select value={getFlag('ui.density.default','comfortable')} onChange={e => { setFlag('ui.density.default', e.target.value); toast.show('עודכן דגל צפיפות'); }}>
              <option value="comfortable">נוח</option>
              <option value="compact">צפוף</option>
            </select>
          </label>
        </div>
        <div className="gt-settingsRow">
          <label>Override Prefetch ניסוי:
            <select value={getFlag('exp.idle-prefetch','')} onChange={e => { const v=e.target.value; setFlag('exp.idle-prefetch', v||undefined); toast.show('Override עודכן'); }}>
              <option value="">(ללא)</option>
              <option value="control">control</option>
              <option value="prefetch">prefetch</option>
            </select>
          </label>
        </div>
      </section>
      <footer className="gt-settingsSheet__ftr">
        <button type="button" className="gt-btn-secondary" onClick={onClose}>סגור</button>
      </footer>
    </div>
  );
}
