היי,

אני מפתח אפליקציית ניהול משימות (TaskFlow) ואני מתעייף מהמצב שכל פעם מגלה בעיה אחרת. פעם זה CSP, פעם זה Firebase Auth, פעם זה חסר כפתור התנתקות, פעם זה indexes בFirestore... אני רוצה שתעזור לי לזהות בפעם אחת את כל הבעיות הפוטנציאליות כדי שנטפל בהכל מראש ולא נתקע כל הזמן.

## המערכת שלי:

- **Frontend**: React 18 + TypeScript + Material-UI
- **Backend**: Firebase (Auth + Firestore)
- **Hosting**: Vercel
- **Build**: CRACO + custom scripts
- **שפה**: עברית (right-to-left)

## מה שעובד עכשיו:

✅ אפליקציה בסיסית פועלת  
✅ Google OAuth עובד (אחרי תיקונים)  
✅ Firestore מחובר ועובד  
✅ Real-time sync  
✅ CSP מוגדר נכון

## בעיות שכבר נתקלתי בהן:

❌ CSP חסם Google Auth  
❌ authDomain לא התאים לדומיין  
❌ חסר Firebase Auth handler  
❌ API key referrers לא מוגדרים  
❌ בעיות cache בVercel  
❌ Firestore indexes חסרים  
❌ אין כפתור התנתקות  
❌ אין חיווי מצב משתמש

## מה אני צריך ממך:

**תעשה לי רשימת בדיקות מקיפה** - כל דבר שיכול להשתבש או להיות חסר באפליקציה כזאת, מאבטחה ועד UX ועד ביצועים. משהו שאני אוכל לעבור עליו סעיף אחר סעיף ולוודא שהכל תקין.

רק דברים מעשיים שאני יכול לבדוק ולתקן, לא תיאוריה.

תודה!

---

**פרטים טכניים אם צריך:**

- Domain: taskflow-sepia.vercel.app
- Firebase project: taskflow-management-app
- Node: 18.x
- GitHub: atiaron/TaskFlow
