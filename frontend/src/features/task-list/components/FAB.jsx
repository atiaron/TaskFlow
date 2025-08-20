import React from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useComposer } from '../../../context/ComposerContext';
import './fab.css';

/**
 * FAB Component - Floating Action Button
 * Container-bound, קבוע במיקומו
 */
const FAB = ({ onClick, hidden = false, variant = 'primary', ariaLabel }) => {
  const { openComposer } = useComposer();
  const { t } = useI18n();
  const className = `google-tasks-fab gt-fab ${variant === 'neutral' ? 'neutral' : ''}`.trim();
  return (
    <button 
      className={className} 
      onClick={onClick || (() => openComposer())} 
      aria-label={ariaLabel || t('aria.addTask')}
      hidden={hidden}
      type="button"
    >
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M12 5V19M5 12H19" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default FAB;