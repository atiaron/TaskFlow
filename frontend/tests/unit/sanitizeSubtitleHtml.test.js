import { sanitizeSubtitleHtml } from '../../src/lib/sanitize';

describe('sanitizeSubtitleHtml', () => {
  it('returns empty string for falsy', () => {
    expect(sanitizeSubtitleHtml('')).toBe('');
    expect(sanitizeSubtitleHtml(null)).toBe('');
  });
  it('keeps allowed inline tags and strips attributes', () => {
    const input = '<b style="color:red" class="x">Bold</b> <span data-x="1">Span</span>';
    const out = sanitizeSubtitleHtml(input);
    expect(out).toBe('<b>Bold</b> <span>Span</span>');
  });
  it('forbids heavy/media tags', () => {
    const input = 'Hi<img src=x onerror=alert(1)> there <iframe src=x></iframe>';
    const out = sanitizeSubtitleHtml(input);
    expect(out).toBe('Hi there '); // img/iframe removed
  });
  it('normalizes <br> to space', () => {
    const input = 'Line1<br>Line2<BR/>Line3';
    const out = sanitizeSubtitleHtml(input);
    expect(out).toBe('Line1 Line2 Line3');
  });
  it('strips scripts completely', () => {
    const input = 'a<script>alert(1)</script>b';
    const out = sanitizeSubtitleHtml(input);
    expect(out).toBe('ab');
  });
});
