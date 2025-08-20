// src/lib/undoService.ts
// Generic Undo Service stack
export type UndoEntry = {
  id: string;
  label: string;
  payload: any;
  undo: (payload: any) => Promise<void> | void;
  createdAt: number;
};

export class UndoService {
  private stack: UndoEntry[] = [];

  push(entry: Omit<UndoEntry, 'id' | 'createdAt'>) {
    const e: UndoEntry = { ...entry, id: (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)), createdAt: Date.now() };
    this.stack.unshift(e);
    return e;
  }
  async runLatest() {
    const e = this.stack.shift();
    if (!e) return;
    await e.undo(e.payload);
  }
  peek() { return this.stack[0] || null; }
  clear() { this.stack = []; }
  size() { return this.stack.length; }
}

export const undoService = new UndoService();
