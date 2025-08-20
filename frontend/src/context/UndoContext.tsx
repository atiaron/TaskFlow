import React, { createContext, useContext } from 'react';
import { defaultUndoManager, type IUndoManager } from '../lib/undoManager';

const UndoCtx = createContext<IUndoManager>(defaultUndoManager);

export const UndoProvider = ({ manager = defaultUndoManager, children }: { manager?: IUndoManager, children: React.ReactNode }) => (
  <UndoCtx.Provider value={manager}>{children}</UndoCtx.Provider>
);

export function useUndo(){ return useContext(UndoCtx); }
