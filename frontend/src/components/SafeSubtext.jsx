import React, { useMemo } from 'react';
import { sanitizeSubtitleHtml } from '../lib/sanitize';

/**
 * SafeSubtext (DEPRECATED) – use sanitizeSubtitleHtml + direct span instead.
 * Thin adapter kept temporarily for compatibility. Uses shared sanitizeSubtitleHtml.
 */
export default function SafeSubtext({ id, value, as = 'div', inert = false }) {
  const { isHtml, sanitized } = useMemo(() => {
    const raw = (value || '').trim();
    if (!raw) return { isHtml: false, sanitized: '' };
    const looksHtml = /<[a-z][\s\S]*>/i.test(raw);
    if (!looksHtml) return { isHtml: false, sanitized: raw };
    const cleaned = sanitizeSubtitleHtml(raw).trim();
    return { isHtml: true, sanitized: cleaned };
  }, [value]);

  if (!sanitized) return null;

  const cls = "gt-subtitle gt-sub"; // canonical + legacy alias
  const Tag = as;
  return isHtml ? (
    <Tag id={id} className={cls} dangerouslySetInnerHTML={{ __html: sanitized }} />
  ) : (
    <Tag id={id} className={cls}>{sanitized}</Tag>
  );
}
