import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

interface ComposerApi { openComposer: (initial?: any) => void; closeComposer: () => void; isOpen: boolean; }
const ComposerCtx = createContext<ComposerApi | null>(null);

export function ComposerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const openComposer = useCallback(() => setOpen(true), []);
  const closeComposer = useCallback(() => setOpen(false), []);
  const api = useMemo<ComposerApi>(() => ({ openComposer, closeComposer, isOpen }), [openComposer, closeComposer, isOpen]);
  return <ComposerCtx.Provider value={api}>{children}</ComposerCtx.Provider>;
}

export function useComposer(){ const v = useContext(ComposerCtx); if(!v) throw new Error('ComposerProvider missing'); return v; }
