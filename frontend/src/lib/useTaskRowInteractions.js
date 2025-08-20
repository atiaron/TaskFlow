import { useCallback, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { t } from '../i18n/i18n';

export function useTaskRowInteractions(task, actions){
  const toast = useToast();
  const { starSurfacesToTop } = useSettings();
  const starredOnce = useRef(typeof localStorage !== 'undefined' && localStorage.getItem('gt_star_hint_shown') === '1');

  const onStar = useCallback(() => {
    const was = !!(task.isStarred || task.starred);
    actions.toggleStar(task.id);
    if (!was && starSurfacesToTop && !starredOnce.current) {
  toast.show(t('toast.starred'));
      try { localStorage.setItem('gt_star_hint_shown', '1'); } catch {}
      starredOnce.current = true;
    }
  }, [task.id, task.isStarred, task.starred, actions, starSurfacesToTop, toast]);

  const onComplete = useCallback(() => { actions.toggleComplete(task.id); }, [actions, task.id]);
  const onOpen = useCallback(() => actions.openDetails?.(task), [actions, task]);
  return { onStar, onComplete, onOpen };
}
