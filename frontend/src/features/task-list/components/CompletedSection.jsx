import React from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { fmtNumber } from '../../../i18n/format';
import TaskRowContainer from './TaskRowContainer';

export default function CompletedSection({ completedTasks = [], onToggleStar, onToggleComplete }) {
  const completed = completedTasks;
  const [open, setOpen] = React.useState(() => {
    try { return localStorage.getItem('gt_completed_open') !== '0'; } catch { return true; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('gt_completed_open', open ? '1' : '0'); } catch {}
  }, [open]);
  const n = completed.length;
  const { t } = useI18n();
  if (!n) return null;
  return (
    <section className="gt-completed-card" role="region" aria-label={t('completed.section', { count: fmtNumber(n) })} aria-expanded={open}>
      <div className="gt-completed-header">
        <button
          className="gt-completed-toggle"
          aria-controls="completed-list"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          type="button"
        >
          <span>{t('completed.section', { count: fmtNumber(n) })}</span>
          <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        </button>
      </div>
      <div id="completed-list" className="gt-completed-body" aria-hidden={!open}>
        <div role="list">
          {completed.map(t => <TaskRowContainer key={t.id} task={t} toggleStar={onToggleStar} toggleComplete={onToggleComplete} />)}
        </div>
      </div>
    </section>
  );
}