import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getPermissionStatus,
  requestPermission,
  openAppSettings,
  markReminderAttempt,
  isReminderRequirementSet,
  clearReminderRequirement,
  onAppResume,
} from '../../lib/reminders';

// Hook: manage reminder notification permission + alert visibility.
// tasks: existing tasks array (each may include reminderAt: number|Date)
export function useReminderPermissions(tasks = []) {
  const [status, setStatus] = useState('unknown'); // 'granted'|'denied'|'prompt'|'default'|'unknown'
  const [requireFlag, setRequireFlag] = useState(isReminderRequirementSet());

  // Initial status fetch
  useEffect(() => { (async () => setStatus(await getPermissionStatus()))(); }, []);
  // Listen to native resume to refresh status
  useEffect(() => onAppResume(async () => setStatus(await getPermissionStatus())), []);

  // If permission granted after requirement flag, clear it
  useEffect(() => {
    if (status === 'granted' && requireFlag) {
      clearReminderRequirement();
      setRequireFlag(false);
    }
  }, [status, requireFlag]);

  // Whether there are tasks with reminders
  const hasReminders = useMemo(
    () => tasks.some(t => Boolean(t?.reminderAt)),
    [tasks]
  );

  // Show alert only if permission not granted and either user attempted or tasks have reminders
  const shouldShow = (status === 'denied' || status === 'default' || status === 'prompt' || status === 'unknown')
    && (requireFlag || hasReminders);

  // To call after first attempt to set a reminder
  const onFirstReminderAttempt = useCallback(async () => {
    markReminderAttempt();
    const s = await requestPermission();
    setStatus(s);
    return s;
  }, []);

  const goToSettings = useCallback(async () => {
    await openAppSettings();
    setStatus(await getPermissionStatus());
  }, []);

  return { status, shouldShow, onFirstReminderAttempt, goToSettings };
}
