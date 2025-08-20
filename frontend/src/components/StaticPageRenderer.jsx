import React, { useEffect, useState } from 'react';
import { getLegalPage } from '../pages/legalPages';
import { sanitizeHtml } from '../security/sanitizeHtml';

/**
 * StaticPageRenderer
 * Renders legal pages based on slug from hash route (#/legal/:slug).
 * Props: slug, onBack (optional)
 */
export default function StaticPageRenderer({ slug, onBack }) {
  const page = getLegalPage(slug);
  const [safeHtml, setSafeHtml] = useState('');
  useEffect(() => {
    let active = true;
    const raw = page ? page.body : '<p>העמוד המבוקש לא נמצא.</p>';
    (async () => {
      const clean = await sanitizeHtml(raw);
      if (active) setSafeHtml(clean);
    })();
    return () => { active = false; };
  }, [page]);
  return (
    <div className="gt-staticPage" dir="rtl">
      <div className="gt-staticPage__inner" role="document">
        <header className="gt-staticPage__hdr">
          {onBack && <button type="button" className="gt-staticPage__back" onClick={onBack} aria-label="חזרה">←</button>}
          <h1 className="gt-staticPage__title">{page ? page.title : 'לא נמצא'}</h1>
        </header>
        {page && <p className="gt-staticPage__meta" aria-label="תאריך עדכון">{page.updated}</p>}
        <main className="gt-staticPage__body" dangerouslySetInnerHTML={{ __html: safeHtml }} />
      </div>
    </div>
  );
}
