import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { kv, migrateLegacyKey } from '../storage/kvStore';

/**
 * SettingsContext
 *  - sortMode: 'manual' | 'date' | 'star' | 'title'
 *  - setSortMode(mode)
 *  - starSurfacesToTop: boolean
 *  - setStarSurfacesToTop(bool)
 *  - overlay state controls (sort / list menu) to remove CustomEvent usage
 *  - openSort(), closeSort(), isSortOpen
 *  - openListMenu(), closeListMenu(), isListMenuOpen
 */
const Ctx = createContext(null);

export function SettingsProvider({ children }) {
  // sortMode persistence
  migrateLegacyKey('gt_sort_mode', 'tf__gt_sort_mode');
  const [sortMode, setSortModeState] = useState(() => {
    try { return kv.get('gt_sort_mode') || 'manual'; } catch { return 'manual'; }
  });
  const setSortMode = useCallback((m) => setSortModeState(m), []);
  useEffect(() => { try { kv.set('gt_sort_mode', sortMode); } catch {} }, [sortMode]);

  // star surfaces to top (future toggle UI) persistence
  migrateLegacyKey('gt_star_surface', 'tf__gt_star_surface');
  const [starSurfacesToTop, setStarSurfacesToTop] = useState(() => {
    try { return kv.get('gt_star_surface') !== '0'; } catch { return true; }
  });
  useEffect(() => { try { kv.set('gt_star_surface', starSurfacesToTop ? '1':'0'); } catch {} }, [starSurfacesToTop]);

  // overlay ui (avoid custom events)
  const [isSortOpen, setSortOpen] = useState(false);
  const [isListMenuOpen, setListMenuOpen] = useState(false);
  const openSort = useCallback(() => setSortOpen(true), []);
  const closeSort = useCallback(() => setSortOpen(false), []);
  const openListMenu = useCallback(() => setListMenuOpen(true), []);
  const closeListMenu = useCallback(() => setListMenuOpen(false), []);

  // theme mode (light | dark | system)
  migrateLegacyKey('gt_theme_mode', 'tf__gt_theme_mode');
  const [themeMode, setThemeModeState] = useState(() => {
    try { return kv.get('gt_theme_mode') || 'system'; } catch { return 'system'; }
  });
  const setThemeMode = useCallback((m) => setThemeModeState(m), []);

  const applyResolvedTheme = useCallback((mode) => {
    const root = document.documentElement;
    root.classList.remove('theme-light','theme-dark');
    if (mode === 'light') root.classList.add('theme-light');
    else if (mode === 'dark') root.classList.add('theme-dark');
    else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      root.classList.add(mq.matches ? 'theme-dark' : 'theme-light');
    }
  }, []);

  // persist + apply
  useEffect(() => {
    try { kv.set('gt_theme_mode', themeMode); } catch {}
    applyResolvedTheme(themeMode);
  }, [themeMode, applyResolvedTheme]);

  // listen to system changes only when mode === system
  useEffect(() => {
    if (themeMode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyResolvedTheme('system');
    try { mq.addEventListener('change', handler); } catch { mq.addListener(handler); }
    return () => { try { mq.removeEventListener('change', handler); } catch { mq.removeListener(handler); } };
  }, [themeMode, applyResolvedTheme]);

  const cycleTheme = useCallback(() => {
    setThemeModeState(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light');
  }, []);

  const value = useMemo(() => ({
    sortMode, setSortMode,
    starSurfacesToTop, setStarSurfacesToTop,
    isSortOpen, openSort, closeSort,
    isListMenuOpen, openListMenu, closeListMenu,
    themeMode, setThemeMode, cycleTheme,
  }), [sortMode, starSurfacesToTop, isSortOpen, isListMenuOpen, setSortMode, themeMode, cycleTheme]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(){ const v = useContext(Ctx); if(!v) throw new Error('SettingsProvider missing'); return v; }
