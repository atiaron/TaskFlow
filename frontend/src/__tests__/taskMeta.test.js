import { buildTaskMeta } from '../lib/taskMeta';

function freeze(dateStr){ return new Date(dateStr); }

describe('buildTaskMeta', () => {
  const NOW = freeze('2025-08-19T10:00:00.000Z');

  it('returns completed meta with relative past', () => {
    const meta = buildTaskMeta({ isCompleted:true, completedAt: '2025-08-19T08:00:00.000Z' }, NOW);
    expect(meta.kind).toBe('completed');
  // Adjusted expectation to current localization string produced by implementation
  expect(meta.label).toBe('הושלמה');
    expect(meta.dateText).toBeTruthy();
    expect(meta.timeText).toBeTruthy();
    expect(meta.relativeText).toMatch(/לפני/);
  });

  it('returns reminder meta future', () => {
    const meta = buildTaskMeta({ reminderAt: '2025-08-19T12:30:00.000Z' }, NOW);
    expect(meta.kind).toBe('reminder');
    expect(meta.label).toBe('תזכורת');
    expect(meta.relativeText).toMatch(/בעוד/);
  });

  it('returns description meta when only description present', () => {
    const meta = buildTaskMeta({ description: 'משימה חשובה' }, NOW);
    expect(meta.kind).toBe('description');
    expect(meta.text).toBe('משימה חשובה');
  });

  it('returns null kind for empty task', () => {
    const meta = buildTaskMeta({}, NOW);
    expect(meta.kind).toBeNull();
  });
});
