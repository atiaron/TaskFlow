# מדריך מיגרציה: Date/Time Picker מודרני

## מצב קיים

בקומפוננטה `TaskDetailsSheet.jsx` קיימים שני אינפוטים:

```jsx
<input type="date" ... />
<input type="time" ... />
```

חסר: אנימציה, בחירה אינטראקטיבית (wheel), נגישות מתקדמת, מניעת ערכים לא חוקיים בזמן גלילה.

## מטרות המודרניזציה

1. חוויית בחירה עקבית (Wheel / Slider) מותאמת מובייל.
2. נגישות: Keyboard ↑/↓, Escape לסגירה, aria-listbox.
3. Tokens-first: שימוש ב-tokens שהוגדרו (`--dt-*`).
4. מניעת Past Dates (אופציונלי) + גבולות min/max.
5. RTL מלא.

## API חדש

```tsx
<DateTimePicker
  isOpen={isPickerOpen}
  onClose={() => setPickerOpen(false)}
  onChange={(ts) => updateTask({ reminderAt: ts })}
  initialValue={task.reminderAt}
  variant="wheel" // או 'slider' או 'native'
  mode="date-time" // 'date' | 'time'
  disablePast
  min={Date.now()}
  dir="rtl"
/>
```

## שלבי מיגרציה

1. הוספת הקבצים החדשים (כבר בוצע):
   - `src/components/DateTimePicker.jsx`
   - `src/ui/datetime.css`
   - הרחבת טוקנים ב-`theme.css`.
2. החלפת שני ה-`<input>` הישנים בכפתור פותח Picker:

```jsx
<button type="button" onClick={()=> setPickerOpen(true)}>קבע תזכורת</button>
<DateTimePicker ... />
```

3. בעת `onChange` לעדכן את ה-task (דומה ל-`applyReminder`).
4. השארת fallback: אם `variant='native'` → עדיין משתמש ב-input רגילים.
5. בדיקות נגישות: הרצת `npm run test:a11y` והוספת תרחיש חדש בעתיד.

## Breaking Changes

- לא נדרש עוד להחזיק שני סטייטים נפרדים (`date` / `time`) בקומפוננטת האב – מקבלים Timestamp אחד.
- עיצוב חדש דורש טעינת `datetime.css` (נטען אוטומטית דרך import ברכיב).

## Backward Compatibility

- שימוש ב-`variant="native"` מספק התנהגות ישנה כמעט זהה.

## טודו עתידי

- תמיכה ב-Infinite year scroll.
- מצב שבוע (Week Picker).
- אנימציית Haptics במובייל (Capacitor).
- בדיקות יחידה לגלילת wheel (simulated scroll events).

## QA מהירה

| בדיקה  | צעד             | צפי                                  |
| ------ | --------------- | ------------------------------------ |
| פתיחה  | לחץ כפתור       | Overlay מופיע + פוקוס ב-wheel הראשון |
| גלילה  | גלול עמודת ימים | היום הפעיל מתעדכן ומתרחב             |
| מקלדת  | ArrowDown       | בחירה זזה יום קדימה                  |
| שמירה  | לחץ "שמירה"     | onChange מקבל timestamp              |
| Escape | לחץ Escape      | onClose הופעל + overlay נסגר         |

---

בהצלחה! 🚀
