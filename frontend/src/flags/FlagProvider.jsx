import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { kv } from '../storage/kvStore';

const FLAGS_LS = 'tf__flags';
const FLAGS_REMOTE_URL = 'tf__flags_remote_url';

const FlagCtx = createContext(null);

export function FlagProvider({ children }) {
  const [flags, setFlags] = useState(() => {
    const j = kv.get(FLAGS_LS);
    try { return j ? JSON.parse(j) : {}; } catch { return {}; }
  });

  useEffect(() => { try { kv.set(FLAGS_LS, JSON.stringify(flags)); } catch {} }, [flags]);

  const refreshRemote = async () => {
    const url = kv.get(FLAGS_REMOTE_URL);
    if (!url) return;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;
      const remote = await res.json();
      setFlags(prev => ({ ...prev, ...(remote.flags || {}) }));
    } catch {}
  };

  const getFlag = (name, fallback) => (flags[name] !== undefined ? flags[name] : fallback);
  const setFlag = (name, value) => setFlags(prev => ({ ...prev, [name]: value }));

  const value = useMemo(() => ({ flags, getFlag, setFlag, refreshRemote }), [flags]);
  return <FlagCtx.Provider value={value}>{children}</FlagCtx.Provider>;
}

export function useFlags() {
  const ctx = useContext(FlagCtx);
  if (!ctx) throw new Error('FlagProvider missing');
  return ctx;
}
