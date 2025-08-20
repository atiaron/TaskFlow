import { buildRowAria } from '../lib/a11y';

const NOW_ITEMS = (iso) => ({ items:[{ type:'datetime', dateText:'19 באוג׳ 2025', timeText:'10:00', kind:'reminder' }] });

describe('buildRowAria', () => {
  it('active without reminder', () => {
    const name = buildRowAria({ title:'בדיקה' }, { items:[] });
    expect(name).toBe('משימה: בדיקה, מצב: פעילה, ללא תזכורת');
  });
  it('completed with reminder datetime', () => {
    const name = buildRowAria({ title:'סיימתי', isCompleted:true }, NOW_ITEMS());
    expect(name).toMatch(/^משימה: סיימתי, מצב: הושלמה, תזכורת 19 באוג׳ 2025 10:00$/);
  });
  it('falls back to default title', () => {
    const name = buildRowAria({}, { items:[] });
    expect(name.startsWith('משימה: משימה ללא כותרת')).toBe(true);
  });
});
