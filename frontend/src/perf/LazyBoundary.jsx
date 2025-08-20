import React, { Suspense } from 'react';

export default function LazyBoundary({ children, fallback = <div className="gt-skeleton" aria-busy="true" /> }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
