// Unified Task Meta schema & selector (JS variant with JSDoc for editor intellisense)
// Matches spec in user request. Convert to .ts when adopting TypeScript.

/** @typedef {'danger'|'warning'|'info'|'success'|'neutral'|'muted'} MetaVariant */
/** @typedef {'overdue'|'today'|'soon'|'none'} Urgency */
/** @typedef {'p1'|'p2'|'p3'|null} Priority */
/** @typedef {'clock'|'check'|'info'|'alert'|'flag'|'tag'} IconName */

/** @typedef {{ type:string, key:string, variant?:MetaVariant }} MetaBase */
/** @typedef {{ type:'badge', kind:'priority'|'overdue'|'reminder'|'completed'|'description'|'tag', label:string, icon?:IconName, level?:'p1'|'p2'|'p3', variant?:MetaVariant }} BadgeMeta */
/** @typedef {{ type:'datetime', when:'reminder'|'completed'|'due', dateISO:string, dateText:string, timeText?:string, tooltip?:string, variant?:MetaVariant }} DateTimeMeta */
/** @typedef {{ type:'relative', when:'reminder'|'completed'|'due', text:string, variant?:MetaVariant }} RelativeMeta */
/** @typedef {{ type:'note', text:string, variant?:MetaVariant }} NoteMeta */
/** @typedef {BadgeMeta|DateTimeMeta|RelativeMeta|NoteMeta} TaskMetaItem */
/** @typedef {{ items:TaskMetaItem[], urgency:Urgency, priority:Priority, flags:{ hasReminder:boolean, isOverdue:boolean, hasDescription:boolean, isCompleted:boolean } }} TaskMeta */

const HE = 'he-IL';

/** @param {string|Date|null|undefined} v */
export function normalizeISO(v){
  if(!v) return null;
  const d = typeof v === 'string' ? new Date(v) : v;
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** @param {string} iso @param {Date} [now] @param {string} [locale] */
export function relativeFromISO(iso, now=new Date(), locale=HE){
  const d = new Date(iso);
  const diffMs = d - now;
  const abs = Math.abs(diffMs);
  const MIN = 60000, H = 60*MIN, D = 24*H;
  let value, unit; // Intl.RelativeTimeFormatUnit
  if (abs < H) { value = Math.round(diffMs / MIN); unit = 'minute'; }
  else if (abs < D) { value = Math.round(diffMs / H); unit = 'hour'; }
  else { value = Math.round(diffMs / D); unit = 'day'; }
  return new Intl.RelativeTimeFormat(locale, { numeric:'auto' }).format(value, unit);
}

/** @param {any} raw */
export function derivePriority(raw){
  const s = (raw ?? '').toString().toLowerCase().trim();
  if(['1','p1','high','גבוהה'].includes(s)) return 'p1';
  if(['2','p2','medium','בינונית'].includes(s)) return 'p2';
  if(['3','p3','low','נמוכה'].includes(s)) return 'p3';
  return null;
}

/** @param {any} task @param {Date} [now] */
export function deriveUrgency(task, now=new Date()){
  if(!task || task.isCompleted || task.completedAt) return 'none';
  const iso = normalizeISO(task.reminderAt);
  if(!iso) return 'none';
  const d = new Date(iso);
  const minutes = Math.round((d - now)/60000);
  if (minutes < 0) return 'overdue';
  const sameDay = d.toDateString() === now.toDateString();
  if (!sameDay) return 'none';
  return minutes <= 60 ? 'today' : 'soon';
}

/** Central selector producing normalized meta */
export function selectTaskMeta(task, now=new Date(), locale=HE){
  const items = [];
  const priority = derivePriority(task?.priority);
  const reminderISO = normalizeISO(task?.reminderAt);
  const completedISO = normalizeISO(task?.completedAt);
  const dueISO = normalizeISO(task?.dueAt);

  const isCompleted = !!(task?.isCompleted || completedISO);
  const urgency = deriveUrgency(task, now);
  const isOverdue = !isCompleted && !!reminderISO && new Date(reminderISO) < now;
  const hasReminder = !!reminderISO;
  const hasDescription = !!(task?.description && String(task.description).trim());

  // Priority first (if exists)
  if (priority) {
    const map = { p1:{label:'עדיפות P1',variant:'danger'}, p2:{label:'עדיפות P2',variant:'warning'}, p3:{label:'עדיפות P3',variant:'neutral'} };
    const {label, variant} = map[priority];
    items.push({ type:'badge', key:'pri', kind:'priority', label, icon:'flag', level:priority, variant });
  }

  if (isCompleted){
    items.push({ type:'badge', key:'completed', kind:'completed', label:'הושלמה', icon:'check', variant:'success' });
    if (completedISO){
      const d = new Date(completedISO);
      items.push({ type:'datetime', key:'completed-dt', when:'completed', dateISO:completedISO, dateText:d.toLocaleDateString(locale,{day:'2-digit',month:'short',year:'numeric'}), timeText:d.toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'}), tooltip:`הושלמה ב־${d.toLocaleString(locale)}`, variant:'muted' });
      items.push({ type:'relative', key:'completed-rel', when:'completed', text:`הושלמה ${relativeFromISO(completedISO, now, locale)}`, variant:'muted' });
    }
  } else {
    if (reminderISO){
      const d = new Date(reminderISO);
      const minutes = Math.round((d - now)/60000);
      const variant = minutes < 0 ? 'danger' : minutes <= 60 ? 'warning' : 'info';
      if (minutes < 0) items.push({ type:'badge', key:'overdue', kind:'overdue', label:'עבר', icon:'alert', variant:'danger' });
      items.push({ type:'badge', key:'rem', kind:'reminder', label:'תזכורת', icon:'clock', variant });
      items.push({ type:'datetime', key:'rem-dt', when:'reminder', dateISO:reminderISO, dateText:d.toLocaleDateString(locale,{day:'2-digit',month:'short',year:'numeric'}), timeText:d.toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'}), tooltip:d.toLocaleString(locale), variant });
      items.push({ type:'relative', key:'rem-rel', when:'reminder', text:relativeFromISO(reminderISO, now, locale), variant });
    }
    if (dueISO){
      const d = new Date(dueISO);
      const variant = d < now ? 'danger' : 'info';
      items.push({ type:'badge', key:'due', kind:'reminder', label:'יעד', icon:'clock', variant });
      items.push({ type:'datetime', key:'due-dt', when:'due', dateISO:dueISO, dateText:d.toLocaleDateString(locale,{day:'2-digit',month:'short',year:'numeric'}), timeText:d.toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'}), tooltip:d.toLocaleString(locale), variant });
      items.push({ type:'relative', key:'due-rel', when:'due', text:relativeFromISO(dueISO, now, locale), variant });
    }
  }

  if (hasDescription){
    items.push({ type:'badge', key:'desc-b', kind:'description', label:'תיאור', icon:'info', variant:'muted' });
    items.push({ type:'note', key:'desc', text:String(task.description).trim(), variant:'neutral' });
  }

  if (Array.isArray(task?.tags) && task.tags.length){
    task.tags.forEach((tag,i)=>{
      items.push({ type:'badge', key:`tag-${i}`, kind:'tag', label:String(tag), icon:'tag', variant:'neutral' });
    });
  }

  return { items, urgency, priority, flags:{ hasReminder, isOverdue, hasDescription, isCompleted } };
}

// Back compat alias – keep until full migration
export const deriveTaskMeta = (task, now) => selectTaskMeta(task, now);