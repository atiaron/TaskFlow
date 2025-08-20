import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadLang, t as tFn, getLang } from './i18n';

export type I18nContextType = {
  lang: 'he' | 'en';
  t: (key: string, params?: Record<string, any>) => string;
  setLang: (lang: 'he' | 'en') => void;
};

const I18nCtx = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<'he' | 'en'>(getLang());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      await loadLang(lang);
      if (live) setReady(true);
    })();
    return () => { live = false; };
  }, [lang]);

  const setLang = (l: 'he' | 'en') => setLangState(l);
  const value = useMemo(() => ({ lang, t: tFn, setLang }), [lang]);

  if (!ready) return null; // Could render a small fallback loader
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('I18nProvider missing');
  return ctx;
}
