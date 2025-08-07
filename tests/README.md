# 🧪 מערכת בדיקות TaskFlow

**מדריך למערכת בדיקות אוטומטיות מותאמת סביבה**

## 📋 סקירה כללית

מערכת הבדיקות של TaskFlow מותאמת לסביבות שונות ומפעילה בדיקות שונות לפי ההקשר:

### 🚦 **סביבות ובדיקות**

| סביבה           | Unit | Integration | E2E | Smoke | שירותים |
| --------------- | ---- | ----------- | --- | ----- | ------- |
| **Development** | ✅   | ✅          | ❌  | ❌    | Mock    |
| **Staging**     | ✅   | ✅          | ✅  | ❌    | Real    |
| **Production**  | ❌   | ❌          | ❌  | ✅    | Real    |
| **CI**          | ✅   | ✅          | ✅  | ✅    | Mixed   |

---

## 🛠️ **סוגי בדיקות**

### 1. **Unit Tests** 🔬

- **מיקום:** `tests/unit/`
- **מטרה:** בדיקת service injection ולוגיקה בסיסית
- **כלים:** Jest
- **זמן ריצה:** < 5 שניות
- **מתי רצות:** תמיד (חוץ מprod)

```bash
npm run test:unit
```

### 2. **Integration Tests** 🔗

- **מיקום:** `tests/integration/`
- **מטרה:** בדיקת תקשורת בין רכיבים
- **כלים:** Custom test runner
- **זמן ריצה:** < 15 שניות
- **מתי רצות:** Dev + CI

```bash
npm run test:integration
```

### 3. **E2E Tests** 🎭

- **מיקום:** `tests/e2e/`
- **מטרה:** בדיקת זרימות משתמש מלאות
- **כלים:** Playwright (בעתיד)
- **זמן ריצה:** < 30 שניות
- **מתי רצות:** Staging + CI בלבד

```bash
npm run test:e2e
```

### 4. **Smoke Tests** 💨

- **מיקום:** `tests/e2e/` (חלק מE2E)
- **מטרה:** בדיקה מהירה שהמערכת עובדת
- **כלים:** HTTP calls
- **זמן ריצה:** < 10 שניות
- **מתי רצות:** Production + CI

```bash
npm run test:smoke
```

---

## 🎯 **התאמה לסביבה**

### **Development Mode** 🔧

```bash
# רק בדיקות מהירות עם mocks
npm run test:dev
```

- Unit tests עם MockAuth
- Integration tests עם שירותי דמה
- אין E2E (לא נדרש OAuth אמיתי)
- דגש על מהירות ופיתוח

### **CI Mode** 🤖

```bash
# סט מלא של בדיקות
npm run test:ci
```

- כל סוגי הבדיקות
- בדיקות על staging ו-prod
- Deploy אוטומטי אחרי הצלחה

### **Production Mode** 🛡️

```bash
# רק בדיקות קריטיות
npm run test:prod
```

- Smoke tests בלבד
- בדיקת health endpoints
- אין הפרעה למשתמשים

---

## ⚡ **הרצת בדיקות**

### **Scripts זמינים:**

```bash
# בדיקות לפי סביבה
npm run test:dev        # Development
npm run test:ci         # CI/Staging
npm run test:prod       # Production

# בדיקות לפי סוג
npm run test:unit       # רק Unit
npm run test:integration # רק Integration
npm run test:e2e        # רק E2E
npm run test:smoke      # רק Smoke

# מיוחדים
npm run test:all        # כל הבדיקות
npm run test:runner     # Test runner חכם
```

### **Test Runner אוטומטי:**

```bash
npm run test:runner
```

- זיהוי סביבה אוטומטי
- הרצת בדיקות רלוונטיות בלבד
- דוח מפורט של תוצאות

---

## 🔧 **קונפיגורציה**

### **Environment Variables:**

- `NODE_ENV` - קובע את סוג הסביבה
- `REACT_APP_IS_DEV_MODE` - מאלץ dev mode
- `CI` - מזהה סביבת CI
- `REACT_APP_ENVIRONMENT` - סביבה ספציפית

### **Test Config** (`tests/setup/test.config.ts`):

```typescript
export const testConfig = {
  runUnitTests: true,
  runIntegrationTests: isDev || isCI,
  runE2ETests: isStaging || isCI,
  runSmokeTests: isProduction || isCI,
  useMockAuth: isDev || !isStaging,
  // ...
};
```

---

## 🚀 **CI/CD Pipeline**

### **GitHub Actions** (`.github/workflows/test-deploy.yml`):

1. **Development Tests** 🔧

   - Unit + Integration עם mocks
   - מהיר וללא תלויות

2. **Staging Tests** 🎯

   - Full test suite עם שירותים אמיתיים
   - E2E עם OAuth אמיתי

3. **Build & Deploy** 📦

   - Build production
   - Deploy לVercel

4. **Production Smoke Tests** 💨
   - בדיקה מהירה שהפריסה הצליחה
   - התראות במקרה של כשל

---

## 📊 **מעקב ודיווח**

### **מטריקות:**

- זמני ריצה לכל סוג בדיקה
- אחוזי הצלחה לפי סביבה
- כיסוי קוד (בעתיד)

### **התראות:**

- כשלים בproduction smoke tests
- בדיקות ארוכות בCI
- שגיאות חוזרות

---

## 🔮 **תכניות עתידיות**

### **קרוב:**

- הוספת Playwright מלא
- בדיקות ויזואליות
- כיסוי קוד מפורט

### **רחוק:**

- בדיקות ביצועים
- בדיקות אבטחה
- מעקב מטריקות בזמן אמת

---

## 🤝 **שימוש למפתחים**

### **לפני Commit:**

```bash
npm run test:dev
```

### **לפני Push:**

```bash
npm run test:runner  # בודק הכל לפי הסביבה
```

### **Debug בדיקות:**

```bash
# הפעל specific test עם logs
NODE_ENV=development npm run test:integration
```

---

## 📚 **משאבים**

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Vercel Deployment](https://vercel.com/docs)
