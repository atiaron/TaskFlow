import { kv } from '../storage/kvStore';

type Dict = Record<string, string>;

type SupportedLang = 'he' | 'en';

const LANG_KEY = 'tf__lang';
const DEFAULT_LANG: SupportedLang = (kv.get(LANG_KEY) as SupportedLang) || 'he';

let currentLang: SupportedLang = DEFAULT_LANG;
let cache: Dict = {};

function setHtmlDirLang(lang: SupportedLang) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'he' ? 'rtl' : 'ltr';
}

function interpolate(s: string, params?: Record<string, any>) {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : `{${k}}`));
}

const pr = new Intl.PluralRules(currentLang);
function pluralize(raw: string, count: number): string {
  // Basic plural handling: just interpolate count.
  return interpolate(raw, { count });
}

export async function loadLang(lang: SupportedLang): Promise<void> {
  if (lang === currentLang && Object.keys(cache).length) return;
  const mod = await import(/* webpackChunkName: "i18n-[request]" */ `./locales/${lang}/common.json`);
  cache = (mod as any).default || (mod as any);
  currentLang = lang;
  kv.set(LANG_KEY, lang);
  setHtmlDirLang(lang);
}

export function getLang(): SupportedLang { return currentLang; }

export function t(key: string, params?: Record<string, any>): string {
  const raw = cache[key];
  if (raw == null) {
    return interpolate(key, params); // fallback to key itself
  }
  if (params && 'count' in params && /\{count\}/.test(raw)) {
    return pluralize(raw, Number(params.count));
  }
  return interpolate(raw, params);
}

// Initialize HTML attrs for initial lang (in case provider loads later)
setHtmlDirLang(currentLang);
