import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

const ComposerCtx = createContext(null);

export function ComposerProvider({ children }) {
  const [isOpen, setOpen] = useState(false);
  const openComposer = useCallback(() => setOpen(true), []);
  const closeComposer = useCallback(() => setOpen(false), []);
  const api = useMemo(() => ({ openComposer, closeComposer, isOpen }), [openComposer, closeComposer, isOpen]);
  return <ComposerCtx.Provider value={api}>{children}</ComposerCtx.Provider>;
}

export function useComposer(){ const v = useContext(ComposerCtx); if(!v) throw new Error('ComposerProvider missing'); return v; }
