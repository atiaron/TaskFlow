# 🚀 TaskFlow - מדריך מהיר למפתח

## ⚡ התחלה תוך 30 שניות

```bash
npm install
npm run dev
# → http://localhost:3000 (עובד עם mocks!)
```

## 🎯 Scripts הכי חשובים

```bash
npm run dev                # פיתוח מלא עם mocks
npm run test:dev          # בדיקות מהירות לפני commit
npm run test:runner       # בדיקה אוטומטית לפי סביבה
npm run build:prod        # build לפרודקשן
npm run health-check      # בדיקת תקינות מערכת
```

## 🧠 Service Injection - הכלל הזהב

### ✅ כך נכון:

```typescript
import { AuthService, ClaudeService } from "../services";
const user = await AuthService.login(); // אוטומטית Mock או Real
```

### ❌ כך לא:

```typescript
import MockAuth from "./MockAuth"; // ❌ אסור!
if (isDev) return MockAuth; // ❌ אסור!
```

## 🔍 איך לדעת באיזה סביבה אני?

```javascript
// בקונסול:
console.log(process.env.NODE_ENV);
// development = Mocks, production = Real
```

## 🚦 סביבות

| מצב         | Services | בדיקות           | מתי         |
| ----------- | -------- | ---------------- | ----------- |
| **Dev**     | Mock     | Unit+Integration | פיתוח יומי  |
| **Staging** | Real     | כל הבדיקות       | לפני deploy |
| **Prod**    | Real     | Smoke בלבד       | אחרי deploy |

## 📁 מבנה קבצים חשוב

```
src/services/
├── index.ts           # 🎯 Service Injector - הלב!
├── MockAuth.ts        # פיתוח
├── RealAuth.ts        # פרודקשן
├── MockClaude.ts      # AI מדומה
└── RealClaude.ts      # AI אמיתי
```

## 🔧 משתני סביבה

```bash
# Development (.env.development)
REACT_APP_IS_DEV_MODE=true
REACT_APP_USE_MOCK_CLAUDE=true

# Production (.env.production)
REACT_APP_IS_DEV_MODE=false
REACT_APP_USE_MOCK_CLAUDE=false
```

## 🧪 בדיקות לפי מצב

```bash
# במהלך פיתוח
npm run test:dev           # מהיר עם mocks

# לפני push
npm run test:runner        # אוטומטי לפי סביבה

# CI/CD
npm run test:ci            # מלא עם real services
```

## 🔥 כללי זהב

### ✅ תמיד:

- Import רק מ-`services/index.ts`
- בדוק שעובד ב-dev וב-prod
- הוסף Mock+Real לשירות חדש
- הרץ `test:dev` לפני commit

### ❌ אסור:

- if/else לבחירת שירותים
- Hard-coded URLs/מפתחות
- בדיקות על prod ישירות
- Import ישיר לMock/Real

## 🆘 Troubleshooting מהיר

```bash
# אתר לא נטען
npm run dev-check

# TypeScript שגיאות
npm run type-check

# שירותים לא עובדים
npm run health-check

# בדיקות נכשלות
npm run test:runner
```

## 🎯 עצות למפתח

1. **תמיד** התחל עם `npm run dev`
2. **אל תיבהל** משגיאות Firebase - יש Mocks!
3. **בדוק** שהכל עובד עם `test:dev`
4. **עבור לפרודקשן** רק כשמוכן
5. **קרא** את ה-console logs - הם מספרים הכל

---

**📖 מדריך מלא:** [README.md](./README.md)  
**🧪 בדיקות:** [tests/README.md](./tests/README.md)  
**⚙️ CI/CD:** [.github/workflows/test-deploy.yml](./.github/workflows/test-deploy.yml)

**🔄 עודכן:** 2025-08-07
