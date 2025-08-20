import React from 'react';
import HeaderTabs from './HeaderTabs';
import EmptyStateCard from './EmptyStateCard';
import FAB from './FAB';
import { useComposer } from '../../../context/ComposerContext';
import './empty-state-v2.css';

/**
 * MobileEmptyState: Implements the new empty state spec.
 * Props: isCreating, setIsCreating, editingTask, onCreateTask
 */
export default function MobileEmptyState() {
  const { openComposer } = useComposer();
  return (
    <div className="google-tasks-wrapper" dir="rtl" data-test="empty-wrapper">
      <HeaderTabs onNewList={() => { /* future multi-list */ }} onStarTab={() => { /* future star filter */ }} />
      <EmptyStateCard />
      <FAB variant="neutral" onClick={openComposer} />
    </div>
  );
}
