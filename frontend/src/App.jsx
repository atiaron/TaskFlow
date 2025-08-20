// src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { mark, measure } from './perfMarkers';
import { useTasks } from './features/task-list/useTasks';
import { selectSortedForView } from './lib/selectors/tasks.selectors';
import { ToastProvider, useToast } from './context/ToastContext';
import { ComposerProvider, useComposer } from './context/ComposerContext';
import { SettingsProvider } from './context/SettingsContext';
import { UndoProvider, useUndo } from './context/UndoContext.jsx';
import AppHeader from './components/AppHeader';
import { AuthProvider } from './contexts/AuthContext';
import AuthGate from './components/AuthGate';
import LazyBoundary from './perf/LazyBoundary';
import EmptyStateCard from './features/task-list/components/EmptyStateCard';
import TaskList from './features/task-list/components/TaskList';
import CompletedSection from './features/task-list/components/CompletedSection';
import ComposerSheet from './features/task-list/components/ComposerSheet';
import SortSheet from './features/sort/SortSheet';
import ListMenuSheet from './features/task-list/components/ListMenuSheet';
import { loadViews, getCurrentViewId } from './lib/views';
import './styles/base.css';
import { idlePrefetch } from './perf/idlePrefetch';
import SkipLink from './a11y/SkipLink';
import { useReducedMotionClass } from './a11y/useReducedMotionClass';
import { maybeRunAutoBackup } from './export/autoBackup';
import { markInteractive } from './obs/perf';
import { useExperiment } from './flags/useExperiment';

// Lazy-loaded heavy / secondary panels (after static imports above)
const SettingsSheet = React.lazy(() => import('./components/SettingsSheet'));
const StaticPageRenderer = React.lazy(() => import('./components/StaticPageRenderer'));
const TaskDetailsSheet = React.lazy(() => import('./components/TaskDetailsSheet'));

function AppInner() {
  useReducedMotionClass();
  mark('app:start-render');
  const { tasks, status, addTask, toggleComplete, toggleStar, updateTask, refresh, isEmptyFiltered, clearCompleted } = useTasks();
  const toastApi = useToast();

  // simple views state for tabs
  const [views, setViews] = useState(() => loadViews());
  const [currentViewId, setCurrentViewIdState] = useState(() => getCurrentViewId());
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const v = loadViews();
        setViews(prev => JSON.stringify(prev) !== JSON.stringify(v) ? v : prev);
        const cv = getCurrentViewId();
        setCurrentViewIdState(prev => prev !== cv ? cv : prev);
      } catch {}
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const currentView = useMemo(() => views.find(v => v.id === currentViewId) || views[0], [views, currentViewId]);
  // Helper to determine completion consistently
  const isTaskCompleted = React.useCallback((t) => !!(t.completed || t.isCompleted || t.completedAt), []);
  const visibleTasks = useMemo(() => selectSortedForView(tasks, currentView), [tasks, currentView]);
  const completedTasks = useMemo(() => visibleTasks.filter(isTaskCompleted), [visibleTasks, isTaskCompleted]);
  const activeVisibleTasks = useMemo(() => visibleTasks.filter(t => !isTaskCompleted(t)), [visibleTasks, isTaskCompleted]);
  const enrichedVisible = useMemo(() => activeVisibleTasks.map(t => ({ task: t, meta: null })), [activeVisibleTasks]);
  const enrichedCompleted = useMemo(() => completedTasks.map(t => ({ task: t, meta: null })), [completedTasks]);
  const isCompletedRoute = currentViewId === 'completed' || currentView?.rule?.kind === 'completed';

  const fabRef = useRef(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTask, setDetailsTask] = useState(null);
  const lastDetailsTrigger = useRef(null);

  function openDetails(task, triggerEl) {
    setDetailsTask(task); setDetailsOpen(true); lastDetailsTrigger.current = triggerEl;
  }
  function closeDetails() { setDetailsOpen(false); setDetailsTask(null); }

  useEffect(() => {
    if (status.isReady) {
      mark('app:ready');
      measure('app:time-to-ready', 'app:start-render', 'app:ready');
      markInteractive();
    }
  }, [status]);

  function handleToggleComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    const wasCompleted = task ? isTaskCompleted(task) : false;
    toggleComplete(taskId);
    toastApi.show(!wasCompleted ? 'סומן שהמשימה בוצעה' : 'בוטל הסימון שהמשימה בוצעה');
  }

  async function handleComposerSave({ title }) {
    const t = (title || '').trim(); if (!t) return false; return await addTask(t);
  }

  const undo = useUndo();
  async function handleClearCompleted() {
    const { cleared } = await clearCompleted();
    if (!cleared.length) { toastApi.show('אין משימות שהושלמו לניקוי'); return; }
    undo.push({
      label: `נוקו ${cleared.length} משימות`,
      payload: { cleared },
      undo: async ({ cleared }) => {
        // Re-insert cleared tasks
        try {
          const existing = JSON.parse(localStorage.getItem('gt_tasks')||'[]');
          const merged = [...cleared, ...existing];
          localStorage.setItem('gt_tasks', JSON.stringify(merged));
        } catch {}
        await refresh();
      }
    });
    toastApi.show(`נוקו ${cleared.length} משימות`, { action: { label: 'בטל', onClick: () => undo.runLatest() } });
  }

  // legacy toast hook removed in favor of ToastContext

  const { openComposer } = useComposer();
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const openSettings = () => setSettingsOpen(true);
  const closeSettings = () => setSettingsOpen(false);
  // Simple hash-based legal pages: #/legal/:slug
  const [hashPath, setHashPath] = useState(() => (typeof window !== 'undefined' ? window.location.hash.slice(1) : ''));
  useEffect(() => {
    function onHash(){ setHashPath(window.location.hash.slice(1)); }
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const legalMatch = /^\/legal\/(.+)$/.exec(hashPath || '');
  const legalSlug = legalMatch ? legalMatch[1] : null;

  // Experiment controlling prefetch aggressiveness
  const prefetchVariant = useExperiment('idle-prefetch', ['control','prefetch']);
  useEffect(() => {
    if (prefetchVariant === 'prefetch') {
      idlePrefetch(() => import(/* webpackPrefetch: true */ './components/SettingsSheet'));
      idlePrefetch(() => import(/* webpackPrefetch: true */ './components/TaskDetailsSheet'));
      idlePrefetch(() => import(/* webpackPrefetch: true */ './components/StaticPageRenderer'));
    } else {
      // control: defer a bit more (example minimal prefetch)
      idlePrefetch(() => import('./components/SettingsSheet'));
    }
  }, [prefetchVariant]);

  // Auto-backup (runs at most once per interval)
  useEffect(() => { maybeRunAutoBackup(); }, []);

  if (legalSlug) {
    return (
      <>
        <SkipLink />
        <main id="main" role="main" className="google-tasks-wrapper" dir="rtl" aria-live="polite">
        <AppHeader currentViewId={currentViewId} activeCount={activeVisibleTasks.length} onOpenSettings={openSettings} />
        <LazyBoundary>
          <StaticPageRenderer slug={legalSlug} />
        </LazyBoundary>
        <footer className="gt-appFooter" role="contentinfo">
          <nav aria-label="קישורי תחתית">
            <ul className="gt-appFooter__links">
              <li><a href="#/legal/privacy">פרטיות</a></li>
              <li><a href="#/legal/terms">תנאים</a></li>
            </ul>
          </nav>
        </footer>
        </main>
      </>
    );
  }

  return (
    <>
      <SkipLink />
      <main id="main" role="main" className="google-tasks-wrapper" dir="rtl" aria-live="polite">
  <AppHeader currentViewId={currentViewId} activeCount={activeVisibleTasks.length} onOpenSettings={openSettings} />
      {status.isLoading && <EmptyStateCard loading />}
      {status.isError && (
        <div className="gt-error-state" role="alert">
          <p>שגיאה בטעינת משימות: {status.error}</p>
          <button type="button" onClick={refresh}>נסה שוב</button>
        </div>
      )}
      {status.isEmpty && !status.isLoading && !status.isError && <EmptyStateCard />}
      {status.isReady && !status.isEmpty && (
        isEmptyFiltered(visibleTasks.length) ? (
          <div className="gt-empty-filtered" role="status">
            <p>אין תוצאות למסנן הנוכחי</p>
          </div>
        ) : (
          <div className="gt-list-stack">
            <TaskList
              enrichedVisible={enrichedVisible}
              enrichedCompleted={enrichedCompleted}
              isCompletedRoute={isCompletedRoute}
              actions={{ toggleStar, toggleComplete: handleToggleComplete, openDetails }}
            />
            {!isCompletedRoute && (
              <CompletedSection completedTasks={completedTasks} onToggleStar={toggleStar} onToggleComplete={handleToggleComplete} />
            )}
          </div>
        )
      )}
  <button ref={fabRef} className="gt-fab" aria-label="הוספת משימה חדשה" onClick={openComposer} data-testid="gt-fab" type="button">+</button>
  <ComposerSheet onSave={handleComposerSave} triggerRef={fabRef} />
      <SortSheet />
      <ListMenuSheet onClearCompleted={handleClearCompleted} />
  <LazyBoundary>
    <SettingsSheet open={isSettingsOpen} onClose={closeSettings} />
  </LazyBoundary>
  <LazyBoundary>
    <TaskDetailsSheet isOpen={detailsOpen} task={detailsTask} onClose={closeDetails} onUpdate={updateTask} onToggleStar={toggleStar} onToggleComplete={handleToggleComplete} initialFocusRef={lastDetailsTrigger} />
  </LazyBoundary>
      <footer className="gt-appFooter" role="contentinfo">
        <nav aria-label="קישורי תחתית">
          <ul className="gt-appFooter__links">
            <li><a href="#/legal/privacy">פרטיות</a></li>
            <li><a href="#/legal/terms">תנאים</a></li>
          </ul>
        </nav>
      </footer>
      </main>
    </>
  );
}
export default function App(){
  return (
    <SettingsProvider>
      <ToastProvider>
        <UndoProvider>
          <ComposerProvider>
            <AuthProvider>
              <AuthGate>
                <AppInner />
              </AuthGate>
            </AuthProvider>
          </ComposerProvider>
        </UndoProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}
// HMR marker added for live dev verification: remove in production if desired.