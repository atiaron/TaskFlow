import React from 'react';

export function IconClock(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false" {...props}>
      <path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2m.75 5.5a.75.75 0 0 0-1.5 0v5.19l-3.22 1.86a.75.75 0 1 0 .75 1.3l3.62-2.09c.23-.13.35-.38.35-.63z" />
    </svg>
  );
}
export function IconCheckCircle(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false" {...props}>
      <path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2m4.3 7.7-5 5a1 1 0 0 1-1.4 0l-2-2a1 1 0 1 1 1.4-1.4l1.3 1.29 4.3-4.29a1 1 0 1 1 1.4 1.4Z" />
    </svg>
  );
}
export function IconInfo(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false" {...props}>
      <path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2m1 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-2 3h2v6h-2z" />
    </svg>
  );
}

/* === Inline Animatable Icons (Check & Star) === */
export function IconCheckMark(props) {
  // 16x16 viewBox minimal path for stroke draw animation; stroke styles applied via CSS
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false" {...props}>
      <path className="gt-checkmark" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 8.5l3 3 7-7" />
    </svg>
  );
}
export function IconStarSolid(props) {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false" {...props}>
      <path fill="currentColor" d="M8 1.6 9.9 6l4.7.4-3.6 3 1.1 4.5L8 11.9 3.9 13.9 5 9.4 1.4 6.4 6.1 6z" />
    </svg>
  );
}

export function IconAlert(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false" {...props}>
      <path fill="currentColor" d="M12 3 1 21h22L12 3Zm0 5.5a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Zm0 10a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z"/>
    </svg>
  );
}

