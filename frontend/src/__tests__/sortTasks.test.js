import { sortTasks } from '../lib/sortTasks';

describe('sortTasks', () => {
  test('orders by createdAt desc when no sortKey', () => {
    const a = { id:'a', createdAt:'2025-08-20T10:00:00.000Z' };
    const b = { id:'b', createdAt:'2025-08-20T11:00:00.000Z' };
    const c = { id:'c', createdAt:'2025-08-19T12:00:00.000Z' };
    const out = sortTasks([a,b,c]);
    expect(out.map(t=>t.id)).toEqual(['b','a','c']);
  });
  test('sortKey asc overrides createdAt', () => {
    const a = { id:'a', createdAt:'2025-08-20T10:00:00.000Z', sortKey: 20 };
    const b = { id:'b', createdAt:'2025-08-20T11:00:00.000Z', sortKey: 10 };
    const c = { id:'c', createdAt:'2025-08-19T12:00:00.000Z' }; // no sortKey
    const out = sortTasks([a,b,c]);
    // a & b have sortKey so they come first ordered asc by sortKey, then c by createdAt desc
    expect(out.map(t=>t.id)).toEqual(['b','a','c']);
  });
});
