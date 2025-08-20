export type UndoPayload = any;
export type UndoAction = {
  id: string;
  label: string;
  payload: UndoPayload;
  undo: (payload: UndoPayload) => Promise<void> | void;
  createdAt: number;
};

export interface IUndoManager {
  push(a: Omit<UndoAction, 'id'|'createdAt'>): UndoAction;
  runLatest(): Promise<void>;
  peek(): UndoAction | null;
  clear(): void;
}

export class UndoManager implements IUndoManager {
  private stack: UndoAction[] = [];
  push(a: Omit<UndoAction, 'id'|'createdAt'>) {
    const entry: UndoAction = { ...a, id: (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)), createdAt: Date.now() };
    this.stack.unshift(entry);
    return entry;
  }
  async runLatest(){ const e = this.stack.shift(); if (e) await e.undo(e.payload); }
  peek(){ return this.stack[0] || null; }
  clear(){ this.stack = []; }
}

export const defaultUndoManager = new UndoManager();
