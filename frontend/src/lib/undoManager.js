export class UndoManager {
  constructor(){ this.stack = []; }
  push(a){
    const entry = { ...a, id: (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)), createdAt: Date.now() };
    this.stack.unshift(entry);
    return entry;
  }
  async runLatest(){ const e = this.stack.shift(); if (e) await e.undo(e.payload); }
  peek(){ return this.stack[0] || null; }
  clear(){ this.stack = []; }
}
export const defaultUndoManager = new UndoManager();
