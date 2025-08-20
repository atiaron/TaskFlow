// Generic Undo Service stack (plain JS)
class UndoService {
  constructor(){ this.stack = []; }
  push(entry){
    const e = { ...entry, id: (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)), createdAt: Date.now() };
    this.stack.unshift(e);
    return e;
  }
  async runLatest(){
    const e = this.stack.shift();
    if (!e) return;
    await e.undo(e.payload);
  }
  peek(){ return this.stack[0] || null; }
  clear(){ this.stack = []; }
  size(){ return this.stack.length; }
}
export const undoService = new UndoService();
export { UndoService };
