import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './error/ErrorBoundary';
import './styles/base.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { I18nProvider } from './i18n/I18nProvider';
import { initErrorReporter } from './obs/errorReporter';
import { mark, observeLongTasks } from './obs/perf';
import { FlagProvider } from './flags/FlagProvider';

// Observability boot
mark('app_start');
initErrorReporter();
observeLongTasks();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <FlagProvider>
          <App />
        </FlagProvider>
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// כיבוי Service Worker בזמן פיתוח לניקוי קאש ובאנדלים ישנים
// Keep development clean (no caching) but register minimal SW in production for app shell
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('[SW] registration failed', err);
    });
  });
} else {
  serviceWorkerRegistration.unregister();
}