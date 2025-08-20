import { kv } from '../storage/kvStore';

const LANG_KEY = 'tf__lang';
const DEFAULT_LANG = kv.get(LANG_KEY) || 'he';

let currentLang = DEFAULT_LANG === 'en' ? 'en' : 'he';
let cache = {};

function setHtmlDirLang(lang) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'he' ? 'rtl' : 'ltr';
}

function interpolate(s, params) {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : `{${k}}`));
}

function pluralize(raw, count) {
  return interpolate(raw, { count });
}

export async function loadLang(lang) {
  if (lang === currentLang && Object.keys(cache).length) return;
  const mod = await import(/* webpackChunkName: "i18n-[request]" */ `./locales/${lang}/common.json`);
  cache = mod.default || mod;
  currentLang = lang;
  kv.set(LANG_KEY, lang);
  setHtmlDirLang(lang);
}

export function getLang() { return currentLang; }

export function t(key, params) {
  const raw = cache[key];
  if (raw == null) return interpolate(key, params);
  if (params && 'count' in params && /\{count\}/.test(raw)) {
    return pluralize(raw, Number(params.count));
  }
  return interpolate(raw, params);
}

setHtmlDirLang(currentLang);
