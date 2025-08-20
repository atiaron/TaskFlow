import DOMPurify from 'dompurify';

/**
 * Sanitizes subtitle HTML into a safe, lightweight subset suitable for a 2-line clamp.
 * Rules:
 *  - Allowed inline formatting tags: b, strong, i, em, u, s, span
 *  - All attributes removed
 *  - Block / media / embed / script related tags forbidden
 *  - <br> normalized to single space to avoid artificial extra lines
 */
export function sanitizeSubtitleHtml(input) {
  if (!input) return '';
  const normalized = String(input).replace(/<\s*br\s*\/?\s*>/gi, ' ');
  return DOMPurify.sanitize(normalized, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 's', 'span'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['img','picture','svg','canvas','video','audio','iframe','object','embed','math','style','link','meta','script'],
    RETURN_TRUSTED_TYPE: false
  });
}
