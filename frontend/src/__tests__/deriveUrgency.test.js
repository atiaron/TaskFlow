import { deriveUrgency } from '../lib/deriveTaskMeta';

// Helper to build task with due date offset (days from today)
function taskWithDue(offsetDays) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, 12, 0, 0, 0);
  return { id: 't'+offsetDays, title: 'Task '+offsetDays, dueDate: d.toISOString(), completed: false };
}

describe('deriveUrgency', () => {
  test('returns none when no due date', () => {
    expect(deriveUrgency({ id:'x', title:'No due' })).toBe('none');
  });
  test('overdue when past date', () => {
    const t = taskWithDue(-1);
    expect(deriveUrgency(t)).toBe('overdue');
  });
  test('today when same day', () => {
    const t = taskWithDue(0);
    expect(deriveUrgency(t)).toBe('today');
  });
  test('soon when within 3 days', () => {
    const t = taskWithDue(2);
    expect(deriveUrgency(t)).toBe('soon');
  });
  test('none when beyond soon window', () => {
    const t = taskWithDue(10);
    expect(deriveUrgency(t)).toBe('none');
  });
  test('completed task still reports urgency but UI may dim', () => {
    const t = { ...taskWithDue(-2), completed: true };
    expect(deriveUrgency(t)).toBe('overdue');
  });
});
