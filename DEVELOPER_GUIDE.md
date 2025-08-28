# תיעוד טכני - TaskFlow Developer Guide

## ⚠ עדכון ארכיטקטורת Frontend 2025 (Sprint UI Reset)

מסמך זה עודכן בעקבות הטרנספורמציה המקיפה (feat/ui-reset-nuke) שבוצעה במודול המשימות. החלקים ההיסטוריים לגבי שירותי Firebase / Realtime עדיין שימושיים למודולים עתידיים, אך שכבת ה-TaskList הנוכחית פועלת במודל קל משקל מקומי (local-first) עם הכנה להרחבה מרחוק.

### עקרונות חדשים מרכזיים

1. Single Source of Truth: כל state של המשימות מרוכז ב-`useTasks()` + הרכיב `App.jsx` (לא סטייט פנימי ברכיבי הצגה).
2. Pure Presentational Components: `TaskRow`, `TaskList`, `LayoutShell`, `DataState`, `Snackbar` מקבלים props בלבד.
3. Deterministic State Flow: כל שינוי (add / update / toggle / clear / undo) עובר דרך hook ומעודכן ב-localStorage מידית.
4. A11y First: תעדוף תפקוד מלא במקלדת, roles, aria-label, focus-visible מותאם, ellipsis נגיש.
5. Progressive Enhancement: PWA + offline + אפשרות Packaging (Capacitor Android) + Dark Mode אוטומטי.
6. Observability: metrics counters + perf marks + snapshot bundle size.

### שכבות Frontend חדשות

| שכבה               | קובץ/תיקיה                                    | תפקיד                                                                          |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------------ |
| State Hook         | `frontend/src/features/task-list/useTasks.js` | CRUD + סניטציה + metrics + undo buffer                                         |
| Persistence        | `storage.js`                                  | טעינה/שמירה ל-localStorage + profile scaffold                                  |
| Root Orchestration | `App.jsx`                                     | חיבור useTasks, סינון, DataState, Snackbar, QuickFilters                       |
| UI Shell           | `LayoutShell.jsx`                             | שלד יישום, כותרת, איזור תוכן, future slots                                     |
| State Views        | `DataState.jsx`                               | מצבי loading / empty / error / ready + skeleton                                |
| List Rendering     | `TaskList.jsx`                                | חלוקה לקבוצות (פעילות / הושלמו / כוכב), כפתור ניקוי, edit wiring               |
| Row                | `TaskRow.jsx`                                 | הצגה אינטראקטיבית (complete/star/edit) + ellipsis + aria                       |
| Editing            | `TaskTitleEditor.jsx`                         | ניהול inline edit עם ESC cancel ו-max length                                   |
| Feedback           | `Snackbar.jsx`                                | Undo clear completed with timeout                                              |
| Metrics            | `metrics.js`                                  | Counters: created, completed, starred, edits, filters, clear/undo, firstTaskAt |
| Performance        | `perfMarkers.js`                              | mark / measure / console log instrumentation                                   |

### ניהול כותרות ומשמעת נתונים

`TITLE_MAX = 200`. כל קלט עובר `sanitizeTitle()` (trim + slice). בדיקות כיסוי מאמתות שלא נוצרת משימה ריקה, ושכותרת ארוכה נחתכת בעקביות (behavior + overflow tests).

### PWA

קבצים: `manifest.json`, `service-worker.js` (CRA registration). אימות DevTools: installable, offline cache עבור bundle הראשי (main.\*.js), אייקונים ב-`/build/icons`.

### Accessibility (A11y) Highlights

- Roles: כל שורת משימה `role="group"` עם aria-label "משימה: {title}".
- Interactive Targets: כפתורי star / complete עם `aria-pressed` משקף מצב.
- Keyboard: Tab order—Add → Filters (tabs) → Task actions. בדיקת כיסוי ב-`App.keyboard.test.jsx`.
- Editing: `ESC` לביטול, Enter לשמירה, `aria-label` לעורך.
- Ellipsis: כותרת עם `title` attribute לשחזור טקסט מלא; בדיקת `App.overflow.test.jsx`.
- Focus Styling: שימוש ב-`:focus-visible` + outline בולטים; שמירה על ניגודיות Dark/Light.
- A11y Tests: `jest-axe` ב-`App.a11y.test.jsx` לאחר מצבים שונים.

### Testing Strategy

| קטגוריה          | קבצים                   | מה נבדק                                                 |
| ---------------- | ----------------------- | ------------------------------------------------------- |
| Behavioral       | `App.behavior.test.jsx` | CRUD, filtering, inline edit, undo, rapid tab switching |
| Keyboard         | `App.keyboard.test.jsx` | Tab sequencing + toggle via Space                       |
| Accessibility    | `App.a11y.test.jsx`     | axe violations absence pre/post task creation           |
| Overflow         | `App.overflow.test.jsx` | Truncation + full title availability                    |
| Hook Unit        | `useTasks.test.jsx`     | sanitize, max length, undo buffer, metrics side-effects |
| E2E (Playwright) | `frontend/tests`        | Happy path create/star/complete/refresh (מופעל ידנית)   |

הרצות CI ללא watch (Windows): ניתן להוסיף סקריפט `"test:ci": "cross-env CI=true react-scripts test --watchAll=false"` כדי למנוע כניסה למצב watch מקומי.

### Metrics & Performance

Counters מתעדכנים בכל handler (לוגיקה מרוכזת). Perf markers (React commit boundaries) מאפשרים future aggregation.
Baseline bundle snapshot (18 Aug 2025):

```
main.bd59ee2f.js 160,602 bytes
MD5: 14e2c437aa4ecd42e4da8725c52744a2
```

קבצי snapshot: `build/bundle-size-summary.txt`, `build/bundle-hash-md5.txt`.

### Theming & Dark Mode

`prefers-color-scheme: dark` ב-tokens / CSS: התאמת צבעים (טקסט/רקע/כפתורים) + שמירת ניגודיות ו-outline. ללא toggle ידני כרגע (מוכן להרחבה).

### Undo Pattern

`clearCompleted()` שומר גיבוי ב-`lastCleared`; `Snackbar` מציע Undo עד timeout. בדיקות: התרחיש ב-`App.behavior.test.jsx`.

### Future Improvements (Backlog Suggestions)

- Virtualization עבור רשימות גדולות (react-window) אם N>500.
- Persisted metrics aggregation + telemetry endpoint.
- Multi-profile sync (להרחיב `ensureProfile`).
- Feature flags לשינויים ניסיוניים.
- Web Share / Notifications PWA capabilities.

---

המשך המסמך (להלן) משמר את התיעוד המקורי לשכבות שירות עתידיות / מודולי צ'אט.

## סקירת ארכיטקטורה 🏗️

### מבנה הפרויקט

```
src/
├── components/           # React components
├── services/            # Business logic services
├── types/              # TypeScript type definitions
├── config/             # Configuration files
└── utils/              # Utility functions
```

### עקרונות עיצוב

- **Service-oriented architecture**: כל הלוגיקה בשירותים נפרדים
- **Type safety**: TypeScript מלא עם validation
- **Real-time sync**: עדכונים בזמן אמת
- **Security first**: אבטחה בכל שכבה
- **Performance monitoring**: מעקב ביצועים רציף

## שירותי הליבה 🛠️

### FirebaseService

**מטרה**: ניהול כל הפעולות עם Firestore
**מיקום**: `src/services/FirebaseService.ts`

```typescript
// דוגמת שימוש
const taskId = await FirebaseService.addTask(userId, {
  title: "משימה חדשה",
  completed: false,
  // ...
});
```

**פונקציות עיקריות**:

- `addTask()`, `updateTask()`, `deleteTask()`, `getUserTasks()`
- `createChatSession()`, `getChatSessions()`, `deleteChatSession()`
- `saveChatMessage()`, `getChatHistory()`
- `subscribeToTasks()`, `subscribeToSessions()`, `subscribeToMessages()`

### SecurityService

**מטרה**: אבטחה, validation ו-rate limiting
**מיקום**: `src/services/SecurityService.ts`

```typescript
// דוגמת שימוש
const validation = SecurityService.validateTask(taskData);
if (!validation.isValid) {
  throw new Error(validation.errors.join(", "));
}
const sanitized = validation.sanitizedData;
```

**תכונות עיקריות**:

- Input sanitization ו-XSS protection
- Rate limiting למניעת spam
- Data validation עם TypeScript
- CSRF protection
- File upload security

### PerformanceMonitor

**מטרה**: מעקב ביצועים ומטריקות
**מיקום**: `src/services/PerformanceMonitor.ts`

```typescript
// דוגמת שימוש
const timer = PerformanceMonitor.startTiming("operation_name");
// ... ביצוע פעולה
PerformanceMonitor.endTiming(timer);

const report = PerformanceMonitor.getPerformanceReport();
```

**מדדים נמדדים**:

- זמני תגובה של פעולות
- שימוש בזיכרון
- רוחב פס רשת
- שגיאות ו-timeouts

### RealTimeSyncService

**מטרה**: סנכרון בזמן אמת בין הממשק לנתונים
**מיקום**: `src/services/RealTimeSyncService.ts`

```typescript
// דוגמת שימוש
RealTimeSyncService.subscribeToTasks(userId, (tasks) => {
  setTasks(tasks);
});
```

**תכונות**:

- Real-time listeners לכל סוגי הנתונים
- Event emission למעדכונים
- Automatic reconnection
- Efficient subscription management

## רכיבי UI עיקריים 🎨

### TaskList

**מטרה**: תצוגה וניהול רשימת משימות
**מיקום**: `src/components/TaskList.tsx`

**תכונות**:

- תצוגת כל המשימות של המשתמש
- עריכה inline של משימות
- Real-time updates
- Filtering ו-sorting
- Add/Edit/Delete operations

### ChatInterface

**מטרה**: ממשק צ'אט עם AI
**מיקום**: `src/components/ChatInterface.tsx`

**תכונות**:

- שיחה עם Claude AI
- ניהול הקשר והזיכרון
- Message history
- Real-time message sync
- Context management

### SessionManager

**מטרה**: ניהול הפעלות צ'אט
**מיקום**: `src/components/SessionManager.tsx`

**תכונות**:

- יצירת הפעלות חדשות
- מעבר בין הפעלות
- מחיקת הפעלות
- Real-time session list

### SystemStatus

**מטרה**: תצוגת סטטוס מערכת ומטריקות
**מיקום**: `src/components/SystemStatus.tsx`

**תכונות**:

- מדדי ביצועים
- מדדי אבטחה
- סטטוס שירותים
- המלצות אופטימיזציה

## ניהול טיפוסים 📝

### מיקום מרכזי

כל הטיפוסים מוגדרים ב-`src/types/index.ts`

### טיפוסים עיקריים

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  category?: string;
  tags?: string[];
  estimatedTime?: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  status: "active" | "archived" | "deleted";
  message_count: number;
  last_message?: string;
  context_summary?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai" | "assistant" | "system";
  timestamp: Date;
  session_id?: string;
  type?: "text" | "task" | "suggestion" | "error" | "system";
  metadata?: Record<string, any>;
}
```

## דפוסי פיתוח 💡

### 1. Service Pattern

כל הלוגיקה העסקית בשירותים נפרדים:

```typescript
// לא טוב - לוגיקה ברכיב
const MyComponent = () => {
  const saveTask = async () => {
    // Firebase logic here...
  };
};

// טוב - לוגיקה בשירות
const MyComponent = () => {
  const saveTask = async () => {
    await FirebaseService.addTask(userId, taskData);
  };
};
```

### 2. Validation Pattern

תמיד validate נתונים לפני שמירה:

```typescript
const addTask = async (taskData: Partial<Task>) => {
  const validation = SecurityService.validateTask(taskData);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(", "));
  }
  return FirebaseService.addTask(userId, validation.sanitizedData);
};
```

### 3. Error Handling Pattern

טיפול בשגיאות עקבי:

```typescript
try {
  const result = await someOperation();
  PerformanceMonitor.recordSuccess("operation_name");
  return result;
} catch (error) {
  PerformanceMonitor.recordError("operation_name", error);
  ErrorRecoveryService.handleError(error);
  throw error;
}
```

### 4. Real-time Pattern

שימוש ב-listeners לעדכונים בזמן אמת:

```typescript
useEffect(() => {
  const unsubscribe = RealTimeSyncService.subscribeToTasks(userId, (tasks) =>
    setTasks(tasks)
  );
  return unsubscribe;
}, [userId]);
```

## הנחיות פיתוח 📏

### 1. קוד איכותי

- **TypeScript Strict Mode**: תמיד השתמש בטיפוסים מלאים
- **ESLint/Prettier**: עקוב אחר כללי הקוד
- **Documentation**: תעד פונקציות מורכבות
- **Error Handling**: טפל בכל השגיאות הצפויות

### 2. ביצועים

- **Lazy Loading**: טען רכיבים לפי הצורך
- **Memoization**: השתמש ב-useMemo/useCallback
- **Bundle Size**: עקוב אחר גודל החבילה
- **Performance Monitoring**: מדוד כל פעולה חשובה

### 3. אבטחה

- **Input Validation**: validate כל קלט משתמש
- **Sanitization**: נקה את הנתונים
- **Rate Limiting**: הגבל פעולות
- **Auth Checks**: בדוק הרשאות בכל פעולה

### 4. בדיקות

```typescript
// דוגמה לבדיקת יחידה
describe("SecurityService", () => {
  test("should validate task correctly", () => {
    const validTask = { title: "Test", completed: false };
    const result = SecurityService.validateTask(validTask);
    expect(result.isValid).toBe(true);
  });
});
```

## אופטימיזציות נפוצות 🚀

### 1. Firestore Optimization

- השתמש ב-compound queries
- הגבל תוצאות עם `limit()`
- השתמש ב-pagination לרשימות גדולות
- ממש indexes מתאימים

### 2. React Optimization

```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => computeExpensiveValue(data), [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  // handle click
}, [dependency]);

// Lazy load components
const LazyComponent = lazy(() => import("./LazyComponent"));
```

### 3. Bundle Optimization

- Tree shaking
- Code splitting
- Dynamic imports
- Bundle analysis

## Debugging וכלי פיתוח 🔧

### React DevTools

- Components hierarchy
- Props/State inspection
- Profiler למדידת ביצועים

### Firebase DevTools

- Firestore console
- Auth users management
- Performance monitoring

### Performance Debugging

```typescript
// Debug performance issues
const timer = PerformanceMonitor.startTiming("debug_operation");
// ... operation
PerformanceMonitor.endTiming(timer);
console.log(PerformanceMonitor.getPerformanceReport());
```

### Security Debugging

```typescript
// Debug security issues
const metrics = SecurityService.getSecurityMetrics();
console.log("Security metrics:", metrics);
```

## עדכונים ותחזוקה 🔄

### 1. עדכון Dependencies

```bash
# בדוק עדכונים זמינים
npm outdated

# עדכן חבילות minor
npm update

# עדכן חבילות major (בזהירות)
npm install package@latest
```

### 2. מיגרציות נתונים

כשמשנים מבנה נתונים, יש לכתוב מיגרציות:

```typescript
const migrateTasksToV2 = async () => {
  const tasks = await FirebaseService.getAllTasks();
  for (const task of tasks) {
    if (!task.version || task.version < 2) {
      await FirebaseService.updateTask(task.id, {
        ...task,
        version: 2,
        newField: "defaultValue",
      });
    }
  }
};
```

### 3. Monitoring ו-Alerts

- הגדר alerts לביצועים
- עקוב אחר שגיאות
- מדוד שימוש ב-API
- נטר מדדי אבטחה

---

**עדכון אחרון**: אוגוסט 2025  
**גרסה**: 1.1.0 (Frontend UI Reset)
