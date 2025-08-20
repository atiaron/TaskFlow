# מדריך מיגרציה: TaskRowModern

## מצב קיים

`features/task-list/components/TaskRow.jsx` מבוסס divים + כפתורי נכון/כוכב, הרחבה מוגבלת למטה דחוס.

מאפיינים קיימים:

- כפתורי check/star.
- meta badges במבנה `gt-metaClamp` (expander כפתור נפרד).
- אין swipe מובנה.
- אין elevation דינמי.
- נגישות: role=listitem, aria-label בסיסי.

## מטרות מודרניזציה

1. Swipe מחוות לפעולות עיקריות (Complete / Star / Delete) ב-RTL.
2. Elevation דינמי (hover / active / action) עם צללים מהטוקנים.
3. Expandable meta עם אנימציית גובה חלקה (layout + transition tokens).
4. Priority indicator ויזואלי (p1/p2/p3) לפני הכותרת.
5. Badge System אחוד (`gt-taskRow-badge`).
6. A11y: aria-pressed בכפתורים, קיצורי מקלדת עתידיים.

## API חדש

```tsx
<TaskRowModern
  task={{ id, title, completed, starred, priority:'p1', meta:'שורת מידע', badges:[{id:'b1', label:'היום'}] }}
  onToggleComplete={(id)=> ...}
  onToggleStar={(id)=> ...}
  onDelete={(id)=> ...}
  onOpenDetails={(task)=> ...}
  initialExpanded={false}
  swipe
/>
```

### מבנה task (מינימום)

```ts
interface ModernTask {
  id: string;
  title: string;
  completed?: boolean;
  starred?: boolean;
  priority?: "p1" | "p2" | "p3";
  meta?: string; // טקסט תיאור / שורה שניה
  badges?: { id: string; label: string; kind?: string }[];
}
```

## שלבי מיגרציה מומלצים

1. הוספת קומפוננטה חדשה בלי לשנות הקיימת (Parallel Run).
2. התאמת Provider/Mapper: הפקת שדות meta + badges במבנה הנדרש.
3. החלפת שימושים ברשימה קטנה (אחוז קטן מהמשתמשים / behind flag).
4. ניטור ביצועים (FPS / bundle diff) + נגישות (jest-axe).
5. הסרה הדרגתית של הישן אחרי אימות.

## חלוקת אינטגרציה בשלבים

| שלב | פעולה                                     | תועלת               |
| --- | ----------------------------------------- | ------------------- |
| 1   | הוספת TaskRowModern + Example             | בידוד סיכונים       |
| 2   | דגל פיצ'ר `useModernTaskRow`              | Toggle קל           |
| 3   | מדידת אינטראקציה (swipe usage)            | אימות UX            |
| 4   | Refactor TaskList לטעינת קומפוננטה דינמית | הפחתת bundle ראשוני |
| 5   | הסרת TaskRow legacy                       | ניקיון קוד          |

## Backward Compatibility

- ניתן להשאיר את המחלקות הישנות לצורך CSS shim זמני אם יש בדיקות תלויות.
- אפשרות `swipe={false}` לקבלת התנהגות סטטית.

## Expanded Meta Notes

- הגבלת שורות (line-clamp) דרך טוקן: `--task-meta-line-clamp`.
- שיקול עתידי: virtualized badges אם מעל X.

## בדיקות QA מהירות

| בדיקה                | צעד                     | צפי                              |
| -------------------- | ----------------------- | -------------------------------- |
| Swipe Complete       | גרירת משימה לימין (RTL) | מופעל onToggleComplete + reset x |
| Swipe Star           | גרירת משימה לשמאל (RTL) | onToggleStar                     |
| Swipe Delete         | גרירה חזקה (פי 1.6)     | onDelete                         |
| Expand               | לחיצה "הרחבה"           | metaClamp מתרחב לשורות נוספות    |
| Keyboard (भקר עתידי) | Arrow + Space           | בחירה/השלמה (TO DO)              |

## TODO עתידי

- Keyboard shortcuts (Left/Right → swipe simulation, Enter → expand).
- Motion reduced state – מעבר ל-css prefers-reduced-motion מלא.
- Haptics במובייל (Capacitor plugin).
- Storybook stories לכל המצבים.

---

בהצלחה בשדרוג! 🚀

---

## Rollout & Feature Flag (Modern Task Row)

כדי לאפשר הדרגתיות בטוחה, נוספה שכבת Gate:

קובץ: `src/featureFlags/modernTasks.js`

### פורמטים נתמכים

1. Query Param: `?modernTasks=on` / `off` / מספר `0-100` (אחוז חשיפה).
2. LocalStorage: `localStorage.setItem('gt_modern_tasks','25')` (לדוגמה 25%).
3. Env Build Time: `REACT_APP_MODERN_TASKS=50` בקובץ `.env`.
4. ברירת מחדל: `off`.

סדר עדיפויות: Query > LocalStorage > Env > Default.

### ערכים תקינים

| ערך   | משמעות                |
| ----- | --------------------- |
| on    | 100% מהמשימות מודרני  |
| off   | 0% (legacy בלבד)      |
| 0-100 | אחוז חשיפה דטרמיניסטי |

### אלגוריתם אחוזים

Hash (FNV-1a) על `task.id` → bucket 0..99 → `< pct` נכנס.

זה מבטיח יציבות (אותה משימה נשארת באותו צד בין רענונים) ומונע הבהובים.

### דוגמאות שימוש

חשיפת 10%: `?modernTasks=10` או `localStorage.setItem('gt_modern_tasks','10')`.

Force ON בדפדפן: `?modernTasks=on` (מבטל לוגיקת אחוזים זמנית).

הסרה: `localStorage.removeItem('gt_modern_tasks')`.

### טלמטריה בסיסית

בלוג: `[modern-task-row] rollout mode: <mode>` בעת טעינת הרשימה. ניתן להחליף בהמשך במערכת event מתקדמת.

להוספת איסוף העמקה (למשל מדידת swipe): קריאה `telemetry.event('taskRow.swipe', { variant:'complete' })` בקומפוננטה.

### אסטרטגיית הרחבה מומלצת

1. Start ב-5% פנימי.
2. בדיקת Crash / Performance / A11y.
3. Increment ל-25%, 50%, 100%.
4. אחרי שבוע יציב: הסרת הקוד הישן.

### בדיקות מוצעות (Unit)

| בדיקה                     | צפי              |
| ------------------------- | ---------------- |
| mode=on → isModern=true   | OK               |
| mode=off → isModern=false | OK               |
| mode=25 → ~25% true       | bucket logic     |
| יציבות hash               | אותה תוצאה חוזרת |

---
