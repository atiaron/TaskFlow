import { getLang } from './i18n';

export function fmtDateTime(date, opts) {
  const lang = getLang();
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat(lang, opts || { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export function fmtNumber(n, opts) {
  const lang = getLang();
  return new Intl.NumberFormat(lang, opts).format(n);
}

export function fmtRelative(target, now = Date.now()) {
  const lang = getLang();
  const t = typeof target === 'string' || typeof target === 'number' ? new Date(target).getTime() : target.getTime();
  const n = typeof now === 'number' ? now : now.getTime();
  let diff = t - n;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const table = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['week', 1000 * 60 * 60 * 24 * 7],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
    ['second', 1000]
  ];
  for (const [unit, ms] of table) {
    if (abs >= ms || unit === 'second') {
      const value = Math.round(diff / ms);
      return rtf.format(value, unit);
    }
  }
  return rtf.format(0, 'second');
}
