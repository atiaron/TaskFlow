import { deriveTaskMeta, derivePriority, isOverdue } from '../lib/deriveTaskMeta';

const base = { id:'t', title:'Demo' };

function withPriority(p){ return { ...base, priority:p }; }
function withReminder(offsetMinutes){
  const now = new Date();
  const d = new Date(now.getTime() + offsetMinutes*60000);
  return { ...base, reminderAt: d.toISOString() };
}

describe('derivePriority', () => {
  test('maps high variants', () => {
    expect(derivePriority(withPriority('1'))).toBe('p1');
    expect(derivePriority(withPriority('p1'))).toBe('p1');
    expect(derivePriority(withPriority('HIGH'))).toBe('p1');
    expect(derivePriority(withPriority('גבוהה'))).toBe('p1');
  });
  test('maps medium variants', () => {
    expect(derivePriority(withPriority('2'))).toBe('p2');
    expect(derivePriority(withPriority('medium'))).toBe('p2');
  });
  test('maps low variants', () => {
    expect(derivePriority(withPriority('3'))).toBe('p3');
    expect(derivePriority(withPriority('low'))).toBe('p3');
  });
  test('returns null for unknown', () => {
    expect(derivePriority(withPriority(''))).toBeNull();
  });
});

describe('isOverdue', () => {
  test('false when no reminder', () => {
    expect(isOverdue(base)).toBe(false);
  });
  test('true when past', () => {
    const past = withReminder(-10);
    expect(isOverdue(past, new Date())).toBe(true);
  });
  test('false when future', () => {
    const future = withReminder(30);
    expect(isOverdue(future, new Date())).toBe(false);
  });
});

describe('deriveTaskMeta integration order', () => {
  test('priority first, overdue second, then reminder cluster', () => {
    const now = new Date();
    const pastReminder = new Date(now.getTime() - 5*60000).toISOString();
    const task = { ...base, priority:'p2', reminderAt: pastReminder };
    const { items } = deriveTaskMeta(task, now);
    // Expect first = priority badge
    expect(items[0].kind).toBe('priority');
    // Expect second = overdue
    expect(items[1].kind).toBe('overdue');
    // Next should include reminder badge before datetime/relative
    const kinds = items.map(i=>i.kind);
    expect(kinds.slice(2)).toContain('reminder');
  });
  test('no overdue badge if reminder future', () => {
    const now = new Date();
    const futureReminder = new Date(now.getTime() + 30*60000).toISOString();
    const task = { ...base, priority:'p1', reminderAt: futureReminder };
    const { items } = deriveTaskMeta(task, now);
    expect(items[0].kind).toBe('priority');
    const kinds = items.map(i=>i.kind);
    expect(kinds).not.toContain('overdue');
  });
});
