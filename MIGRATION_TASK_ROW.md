## מיגרציה ל-TaskRowV2

מטרה: לאחד את `TaskRow` הישן ו-`TaskRowModern` לגרסה יחידה מודרנית עם Tokens אחידים ו-Primitives.

### צעדים

1. ייבוא חדש: `import { TaskRowV2 } from './components/TaskRowV2';`
2. Props קיימים בשימוש קודם:
   - `task` (object) חובה
   - `onToggleComplete(id)`
   - `onToggleStar(id)`
   - `onDelete(id)` (חדש יחסית – היה רק ב-Modern)
   - `onOpenDetails(task)`
   - `onExpandChange(id, expanded)`
   - `initialExpanded?` / `swipe?` / `disableAnimations?`
3. החלף הופעות של `<TaskRow ... />` או `<TaskRowModern ... />` ב `<TaskRowV2 ... />`.
4. מטא נתונים / badges:
   - הקודם: `items` או `badges` -> עכשיו העדפה לשדה `task.badges = [{id,label,variant}]`.
   - טקסט נוסף (meta/description) בשדה `task.meta`.
5. נגישות:
   - נשמר `role="listitem"`.
   - כפתורי אייקון בעלי `aria-label`.
6. עיצוב:
   - תלוי ב-`tokens-unified.css` + `task-row-modern.css` (לשימור tokens קיימים). ודא ששני הקבצים נטענים.
7. RTL:
   - כיוון swipe כרגע קבוע `rtl`; להסבה ל-Bidirectional: להחליף `const dir = 'rtl'` לחילוץ מ `document.dir` או prop.

### התאמות Logic

אם לוגיקת השלמה/כוכב הסתמכה על מחלקות (`gt-check is-on`), כעת השתמש ב-props `task.completed` / `task.starred`.

### Deprecation

`TaskRowModern.jsx` ו `TaskRow.jsx` יסומנו כ-deprecated לאחר אימוץ מלא; ניתן ליצור wrapper זמני שמזהיר בקונסול.

### בדיקות

1. בדיקות UI קיימות: עדכן selectors (data-task-id נשאר, כפתורי פעולה כעת `.gt-iconBtn`).
2. Accessibility: הרצת `jest-axe` על container של רשימת משימות עם focus traversal.

### הרחבות עתידיות

- אנימציית Spark ל-star ו-Pulse ל-check באמצעות Framer Motion variants.
- Haptic feedback (בקפסיטור) בזמן השלמה / favorite.
- Gesture Velocity detection במקום threshold קשיח.
