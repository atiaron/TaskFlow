import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadLang, t as tFn, getLang } from './i18n';

const I18nCtx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getLang());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      await loadLang(lang);
      if (live) setReady(true);
    })();
    return () => { live = false; };
  }, [lang]);

  const setLang = (l) => setLangState(l);
  const value = useMemo(() => ({ lang, t: tFn, setLang }), [lang]);

  if (!ready) return null;
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('I18nProvider missing');
  return ctx;
}
