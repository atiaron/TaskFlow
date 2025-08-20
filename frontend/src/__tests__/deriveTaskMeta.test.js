import { deriveTaskMeta } from '../lib/deriveTaskMeta';

function freeze(dateStr){ return new Date(dateStr); }

describe('deriveTaskMeta', () => {
  const NOW = freeze('2025-08-19T10:00:00.000Z');

  it('yields completed badge + datetime + relative + note', () => {
    const { items } = deriveTaskMeta({ isCompleted:true, completedAt:'2025-08-19T08:00:00.000Z', description:'Desc' }, NOW);
    const kinds = items.map(i=>i.kind);
    expect(items.find(i=>i.type==='badge' && i.kind==='completed')).toBeTruthy();
    expect(items.find(i=>i.type==='datetime')).toBeTruthy();
    expect(items.find(i=>i.type==='relative')).toBeTruthy();
    expect(items.find(i=>i.type==='note')).toBeTruthy();
    expect(kinds.includes('completed')).toBe(true);
  });

  it('applies danger variant for overdue reminder', () => {
    const { items } = deriveTaskMeta({ reminderAt:'2025-08-19T09:30:00.000Z' }, NOW);
    const badge = items.find(i=>i.type==='badge');
    expect(badge.variant).toBe('danger');
  });

  it('applies warning for <=60 minute future reminder', () => {
    const { items } = deriveTaskMeta({ reminderAt:'2025-08-19T10:45:00.000Z' }, NOW);
    const badge = items.find(i=>i.type==='badge');
    expect(badge.variant).toBe('warning');
  });

  it('applies info for distant future reminder', () => {
    const { items } = deriveTaskMeta({ reminderAt:'2025-08-19T14:00:00.000Z' }, NOW);
    const badge = items.find(i=>i.type==='badge');
    expect(badge.variant).toBe('info');
  });

  it('description only yields badge + note', () => {
    const { items } = deriveTaskMeta({ description:'משימה חשובה' }, NOW);
    expect(items.filter(i=>i.type==='badge').length).toBe(1);
    expect(items.filter(i=>i.type==='note').length).toBe(1);
    expect(items.some(i=>i.type==='datetime')).toBe(false);
  });

  it('empty task yields no items', () => {
    const { items } = deriveTaskMeta({}, NOW);
    expect(items.length).toBe(0);
  });
});
