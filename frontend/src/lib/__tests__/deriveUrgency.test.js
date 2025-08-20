import { deriveUrgency } from '../deriveTaskMeta';

describe('deriveUrgency', () => {
  const baseNow = new Date('2025-08-19T10:00:00Z');
  function addMinutes(m){ return new Date(baseNow.getTime() + m*60000).toISOString(); }
  function sameDayLater(hours){ return new Date(baseNow.getTime() + hours*3600000).toISOString(); }

  it('returns none when no reminder', () => {
    expect(deriveUrgency({}, baseNow)).toBe('none');
  });
  it('returns overdue for past reminder', () => {
    expect(deriveUrgency({ reminderAt: addMinutes(-5) }, baseNow)).toBe('overdue');
  });
  it('returns today for within next 60 minutes', () => {
    expect(deriveUrgency({ reminderAt: addMinutes(45) }, baseNow)).toBe('today');
  });
  it('returns soon for later today beyond 60 minutes', () => {
    expect(deriveUrgency({ reminderAt: sameDayLater(3) }, baseNow)).toBe('soon');
  });
  it('returns none for different day', () => {
    const tomorrow = new Date(baseNow.getTime() + 24*3600000).toISOString();
    expect(deriveUrgency({ reminderAt: tomorrow }, baseNow)).toBe('none');
  });
  it('returns none for completed tasks even if future reminder', () => {
    expect(deriveUrgency({ reminderAt: addMinutes(30), completedAt: addMinutes(-1) }, baseNow)).toBe('none');
  });
});
