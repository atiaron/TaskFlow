let __purify = null;

async function getPurify() {
  if (__purify) return __purify;
  const mod = await import('dompurify');
  __purify = mod.default || mod;
  return __purify;
}

/**
 * מנקה HTML לאמון נמוך עם טעינה עצלה של DOMPurify.
 * Includes conservative allowlist.
 */
export async function sanitizeHtml(html) {
  try {
    const DOMPurify = await getPurify();
    return DOMPurify.sanitize(String(html || ''), {
      ALLOWED_TAGS: ['b','i','em','strong','u','a','br','span','ul','ol','li','p'],
      ALLOWED_ATTR: ['href','title'],
      KEEP_CONTENT: true
    });
  } catch {
    return String(html || '')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/\son[a-z]+="[^"]*"/gi, '');
  }
}
