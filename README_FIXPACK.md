# Fix Pack — Clear Completed + Task Details

## בדיקות ידניות

### נקה משימות שהושלמו

1. צור 3 משימות (כפתור "+").
2. סמן 2 מהן כבוצעו (✓).
3. פתח תפריט רשימה (⋮ / כפתור עם aria-label="תפריט רשימה").
4. לחץ "נקה משימות שהושלמו".
5. אימות:
   - נשארה משימה פעילה אחת.
   - ה-Snackbar מופיע עם הטקסט: `נוקו 2 משימות שהושלמו` ונעלם אחרי ~4 שניות.
   - ב-localStorage בקי `taskflow_tasks` אין אובייקטים עם `completed: true`.
   - הפוקוס חזר לכפתור התפריט.

### Task Details Sheet

1. צור משימה חדשה.
2. לחץ על כותרת המשימה (לא על כוכב / וי) — נפתח Sheet.
3. אימות נגישות:
   - `role="dialog" aria-modal="true"`.
   - Overlay פעיל ואפשר לסגור ב-Escape או קליק מחוץ.
   - Tab/Shift+Tab לא יוצאים מה-Sheet.
4. הוסף תאריך + שעה (Date + Time) — סגור.
5. אימות:
   - הפוקוס חזר לכותרת המשימה.
   - בשורה מופיע טקסט משנה עם שעה / תאריך.

## קבצים שנוספו/עודכנו

- `src/features/task-list/useTasks.js` — clearCompleted מחזיר מספר שנמחק.
- `src/features/task-list/components/ListMenuSheet.jsx` — קריאה ל-clearCompleted + פוקוס.
- `src/components/TaskDetailsSheet.jsx` — Sheet חדש.
- `src/features/task-list/components/TaskList.jsx` / `TaskRow.jsx` — פתיחת Sheet.
- `src/styles/base.css` — סגנונות Sheet.
- Tests: `tests/e2e/clear-completed.spec.ts`, `tests/e2e/task-details.spec.ts`.

## DoD

- ניקוי משימות הושלמו עובד ומתעדכן ב-UI.
- Sheet פרטי משימה נגיש ונסגר נכון עם החזרת פוקוס.
- טסטים עוברים.
- אין שגיאות קונסול / נגישות קריטיות.
