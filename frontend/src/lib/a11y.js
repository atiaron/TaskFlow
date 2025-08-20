/**
 * Accessibility helpers for task rows.
 */

/**
 * Create concise accessible name for a task row.
 * Format: "משימה: {title}, מצב: {הושלמה|פעילה}, {תזכורת <date> <time>|ללא תזכורת}".
 * Description text deliberately omitted to keep name short.
 * @param {object} task
 * @param {{ items?: Array<{type:'badge'|'datetime'|'relative'|'note', kind?:string, dateText?:string, timeText?:string}> }} metaTokens
 * @returns {string}
 */
export function buildRowAria(task, metaTokens){
  const title = String(task?.title || '').trim() || 'משימה ללא כותרת';
  const isCompleted = !!(task?.isCompleted || task?.completedAt);
  const state = isCompleted ? 'הושלמה' : 'פעילה';
  const prRaw = (task?.priority ?? '').toString();
  const prText = /^(1|p1|high|גבוהה)$/i.test(prRaw) ? 'גבוהה' :
                  /^(2|p2|medium|בינונית)$/i.test(prRaw) ? 'בינונית' :
                  /^(3|p3|low|נמוכה)$/i.test(prRaw) ? 'נמוכה' : null;

  let timeStr = 'ללא תזכורת';
  const dt = metaTokens?.items?.find(i => i.type === 'datetime');
  if (dt?.dateText) {
    timeStr = `תזכורת ${dt.dateText}${dt.timeText ? ` ${dt.timeText}` : ''}`;
  }
  return `משימה: ${title}, מצב: ${state}${prText ? `, עדיפות: ${prText}` : ''}, ${timeStr}`;
}
