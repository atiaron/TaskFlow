import React, { createContext, useContext } from 'react';
import { defaultUndoManager } from '../lib/undoManager.js';

const UndoCtx = createContext(defaultUndoManager);
export const UndoProvider = ({ manager = defaultUndoManager, children }) => (
  <UndoCtx.Provider value={manager}>{children}</UndoCtx.Provider>
);
export function useUndo(){ return useContext(UndoCtx); }
