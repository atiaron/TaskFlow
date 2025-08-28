# הוראות הפעלה - מערכת TaskFlow

## דרישות מקדימות 📋

### סביבת פיתוח
- Node.js 18+ 
- npm או yarn
- Git
- Visual Studio Code (מומלץ)

### שירותי חוץ
- Firebase Project עם Firestore
- Claude API Key (Anthropic)
- Google OAuth תצורה

## התקנה ראשונית 🚀

### 1. הורדת הפרויקט
```bash
git clone <repository-url>
cd TaskFlow
npm install
```

### 2. תצורת Firebase
1. צור פרויקט חדש ב-Firebase Console
2. הפעל Authentication (Google OAuth)
3. הפעל Firestore Database
4. העתק את תצורת Firebase ל-`src/config/firebase.ts`

### 3. תצורת Claude API
1. קבל API Key מ-Anthropic
2. הגדר משתנה סביבה: `REACT_APP_CLAUDE_API_KEY`

### 4. הפעלת הפרויקט
```bash
npm start
```

## מעבר לפרודקציה 🛡️

### 1. אבטחת Firestore
```bash
# החלף את firestore.rules בגרסת הפרודקציה
cp firestore.rules.production firestore.rules
firebase deploy --only firestore:rules
```

### 2. הגדרות סביבה
```bash
# הגדר משתני סביבה לפרודקציה
REACT_APP_CLAUDE_API_KEY=your_key_here
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

### 3. בניית פרודקציה
```bash
npm run build
```

### 4. פריסה
```bash
# Firebase Hosting
firebase deploy

# או Vercel
vercel deploy

# או Netlify
netlify deploy --prod --dir=build
```

## תחזוקה שוטפת 🔧

### מוניטורינג
- עקוב אחר מדדי הביצועים ב-SystemStatus
- בדוק logs ב-Firebase Console
- מעקב אחר שימוש ב-Claude API

### עדכונים
- עדכן dependencies בקביעות
- בדוק ביצועים אחרי עדכונים
- גבה נתונים לפני עדכונים גדולים

### אבטחה
- עקוב אחר מדדי האבטחה במערכת
- בדוק logs לפעילות חשודה
- עדכן כללי Firestore לפי הצורך

## פתרון בעיות נפוצות 🔍

### בעיות חיבור
1. בדוק תצורת Firebase
2. ודא שה-API Keys תקינים
3. בדוק רשתת אינטרנט

### בעיות ביצועים
1. בדוק מדדי ביצועים ב-SystemStatus
2. עקוב אחר המלצות האופטימיזציה
3. נקה cache הדפדפן

### בעיות אבטחה
1. בדוק מדדי אבטחה
2. עקוב אחר rate limiting
3. ודא שכללי Firestore פעילים

## פיתוח נוסף 💻

### הוספת תכונות חדשות
1. עקוב אחר ארכיטקטורת השירותים הקיימת
2. הוסף validation מתאים
3. עדכן את הטיפוסים ב-`src/types/`
4. בדוק ביצועים ואבטחה

### בדיקות
```bash
# הרץ בדיקות
npm test

# בדיקות כיסוי
npm run test:coverage
```

## תמיכה טכנית 🆘

### לוגים
- בדוק Console ב-DevTools
- עיין ב-Firebase Console > Functions Logs
- מעקב אחר Performance Monitor

### גיבוי ושחזור
```bash
# גיבוי Firestore
firebase firestore:backup gs://your-backup-bucket

# שחזור
firebase firestore:restore gs://your-backup-bucket/backup-file
```

### עדכון תלות
```bash
# עדכון חבילות
npm update

# בדיקת חבילות מיושנות
npm audit

# תיקון בעיות אבטחה
npm audit fix
```

---
**הערה**: תמיד גבה את הנתונים לפני עדכונים או שינויים גדולים במערכת.
