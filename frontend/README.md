# TaskFlow Frontend

אפליקציית ניהול משימות מתקדמת בעברית עם עיצוב חכם ו-UX מתקדם.

## מבנה הפרויקט

```
frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopBar.jsx      # סרגל עליון
│   │   │   └── RightRail.jsx   # סרגל צד ימני
│   │   ├── task/
│   │   │   ├── TaskCard.jsx              # כרטיס משימה
│   │   │   └── SmartTaskListContainer.jsx # רשימת משימות חכמה
│   │   └── ui/
│   │       ├── ProgressRing.jsx # טבעת התקדמות
│   │       ├── Pill.jsx         # תגית עגולה
│   │       └── Toast.jsx        # הודעות popup
│   ├── styles/
│   │   ├── index.css        # סגנון ראשי
│   │   ├── shell.css        # עיצוב המעטפת
│   │   ├── rightRail.css    # עיצוב הסרגל הצדדי
│   │   ├── smartux.css      # עיצובי UX חכם
│   │   └── progressRing.css # עיצוב הטבעת
│   ├── utils/
│   │   ├── taskUtils.js     # פונקציות עזר למשימות
│   │   └── iconUtils.js     # פונקציות עזר לאיקונים
│   ├── App.jsx              # רכיב ראשי
│   └── index.js            # נקודת כניסה
└── package.json
```

## תכונות

- **עיצוב מתקדם**: Glass morphism וטבעות התקדמות עם Framer Motion
- **UX חכם**: קיבוץ משימות לפי תאריכים, מצב פוקוס, והוספה מהירה
- **עברית**: תמיכה מלאה בעברית כולל RTL
- **רספונסיבי**: מתאים לכל הגדלי מסך
- **אינטראקטיבי**: אנימציות חלקות וחוויית משתמש מתקדמת

## הרצה

\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

## טכנולוגיות

- React 18
- Framer Motion (אנימציות)
- Lucide React (אייקונים)
- CSS מודולרי
- Material Symbols

## רכיבים מרכזיים

### TaskCard

כרטיס משימה עם:

- טבעת התקדמות
- כפתורי פעולה
- משימות משנה
- תגיות וקטגוריות

### SmartTaskListContainer

רשימת משימות חכמה עם:

- קיבוץ לפי תאריכים
- מצב פוקוס
- הוספה קונטקסטואלית
- מחוונים חזותיים

### TopBar & RightRail

ממשק ניהול עם:

- סרגל ניווט עליון
- סינון והכר לפי פרויקטים
- ספירות דינמיות
