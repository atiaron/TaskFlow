<!-- cspell:disable -->
# 🚀 TaskFlow v2.0
## AI Personal Task Manager with Firebase

**תאריך יצירה:** 2025-08-05  
**מפתח:** atiaron  
**טכנולוגיות:** React + TypeScript + Firebase + Claude AI

---

## 🎯 **מה זה TaskFlow?**

TaskFlow הוא מנהל משימות אישי חכם שמשלב:
- 🤖 **AI Assistant** עם Claude לניהול משימות בעברית
- 🔥 **Firebase** לאחסון ריאלטיים 
- ⚛️ **React + TypeScript** לממשק משתמש מתקדם
- 🔐 **Google Authentication** להתחברות מאובטחת
- 📱 **Mobile-First Design** לחוויה מושלמת

---

## 🏗️ **מבנה הפרויקט:**

```
TaskFlow/
├── 📁 src/
│   ├── 📁 components/     # רכיבי React
│   ├── 📁 services/       # שירותי Firebase + AI
│   ├── 📁 config/         # הגדרות Firebase
│   └── types.ts           # טיפוסי TypeScript
├── 📁 server/             # Backend עם Claude API
├── 📁 public/             # קבצים סטטיים
├── .env.example           # דוגמה להגדרות Firebase
└── server/.env.example    # דוגמה למפתח Claude
```

---

## 🚀 **התקנה והרצה:**

### **דרישות מוקדמות:**
- Node.js 16+
- חשבון Firebase
- Claude API Key מ-Anthropic

### **1️⃣ שכפול הפרויקט:**
```bash
git clone https://github.com/atiaron/TaskFlow.git
cd TaskFlow
```

### **2️⃣ התקנת תלויות:**
```bash
npm install
cd server && npm install
cd ..
```

### **3️⃣ הגדרת משתני סביבה:**

**Firebase (.env.development):**
```bash
cp .env.example .env.development
# ערוך את הקובץ עם נתוני Firebase שלך
```

**Claude API (server/.env):**
```bash
cd server
cp .env.example .env
# הוסף את Claude API Key שלך
```

### **4️⃣ הרצה:**
```bash
# טרמינל 1 - Backend:
cd server
npm run dev

# טרמינל 2 - Frontend:
npm start
```

**🌐 פתח:** http://localhost:3000

---

## 🔥 **הגדרת Firebase:**

### **1. צור פרויקט Firebase:**
1. https://console.firebase.google.com
2. Create Project → `taskflow-[שמך]`
3. Enable Google Analytics (אופציונלי)

### **2. הפעל Firestore:**
1. Firestore Database → Create
2. Start in test mode
3. בחר מיקום (europe-west1 מומלץ)

### **3. הפעל Authentication:**
1. Authentication → Get started
2. Sign-in method → Google → Enable
3. הוסף support email

### **4. צור Web App:**
1. Project Overview → Add app → Web
2. App name: TaskFlow
3. העתק firebaseConfig ל-.env.development

---

## 🤖 **הגדרת Claude AI:**

### **1. קבל API Key:**
1. https://console.anthropic.com
2. Create account / Login
3. API Keys → Create Key
4. העתק המפתח ל-server/.env

### **2. Function Calling:**
המערכת תומכת ב-Function Calling לפעולות כמו:
- יצירת משימות מטקסט טבעי
- עדכון משימות קיימות
- תזכורות חכמות

---

## 📱 **תכונות עיקריות:**

### **🎯 ניהול משימות:**
- ✅ יצירה/עריכה/מחיקה של משימות
- 🏷️ תגיות ועדיפויות
- 📅 תאריכי יעד
- ⏱️ הערכת זמן ביצוע

### **💬 AI Assistant:**
- 🗣️ שיחה בעברית טבעית
- 🎬 יצירת משימות מטקסט חופשי
- 🧠 הבנת הקשר וזיכרון שיחות
- ⚡ תגובות מיידיות

### **🔐 אבטחה:**
- 🔑 Google OAuth 2.0
- 🛡️ Firebase Security Rules
- 🔒 הפרדת נתונים בין משתמשים
- 🌐 HTTPS בפרודקשן

### **📱 חוויית משתמש:**
- 📱 Mobile-First Responsive Design
- 🌙 תמיכה בעברית (RTL)
- ⚡ טעינה מהירה
- 🔄 סנכרון ריאלטיים

---

## 🛠️ **טכנולוגיות:**

### **Frontend:**
- ⚛️ React 18 + TypeScript
- 🎨 Material-UI (MUI)
- 🔥 Firebase SDK v10
- 📱 PWA Ready

### **Backend:**
- 🟢 Node.js + Express
- 🤖 Claude API Integration
- 🔧 Function Calling Support
- 📡 RESTful API

### **Database:**
- 🔥 Firebase Firestore
- 🔐 Firebase Authentication
- ☁️ Cloud Storage (עתידי)

---

## 📊 **API Endpoints:**

### **Backend (localhost:4000):**
```
GET  /health              # בדיקת תקינות
POST /api/claude         # שליחה ל-Claude AI
```

### **Frontend (localhost:3000):**
```
/                        # מסך ראשי
/tasks                   # רשימת משימות
/chat                    # צ'אט עם AI
/calendar               # לוח שנה (עתידי)
```

---

## 🔧 **פיתוח:**

### **הרצה במצב פיתוח:**
```bash
npm run dev              # Frontend + Backend יחד
npm start               # Frontend בלבד
npm run server          # Backend בלבד
```

### **בדיקות:**
```bash
npm test                # React tests
npm run build           # Production build
```

### **Debugging:**
```bash
# בדיקת Backend:
curl http://localhost:4000/health

# בדיקת Firebase:
# פתח Console → Network בדפדפן
```

---

## 🚀 **Deploy (עתידי):**

### **Frontend - Vercel/Netlify:**
```bash
npm run build
# העלה את תיקיית build/
```

### **Backend - Railway/Heroku:**
```bash
# הגדר משתני סביבה בפלטפורמה
# Deploy את תיקיית server/
```

---

## 🤝 **תרומה:**

1. Fork הפרויקט
2. צור branch חדש: `git checkout -b feature/amazing-feature`
3. Commit השינויים: `git commit -m 'Add amazing feature'`
4. Push ל-branch: `git push origin feature/amazing-feature`
5. פתח Pull Request

---

## 📞 **תמיכה:**

- 📧 **Email:** atiaron@gmail.com
- 🐛 **Issues:** GitHub Issues
- 💬 **Discussions:** GitHub Discussions

---

## 📜 **רישיון:**

MIT License - ראה [LICENSE](LICENSE) לפרטים

---

## 🙏 **תודות:**

- 🤖 **Anthropic** - Claude AI API
- 🔥 **Google Firebase** - Backend as a Service
- ⚛️ **React Team** - Amazing Frontend Framework
- 🎨 **Material-UI** - Beautiful Components

---

**📅 עודכן לאחרונה:** 2025-08-05  
**⭐ אם הפרויקט עזר לך - תן כוכב!**
