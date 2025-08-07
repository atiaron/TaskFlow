# טסטים לבדיקת CSP Fix בפרודקשן

## Test 01: בדיקת CSP Headers בפועל

```bash
# ב-Browser Console:
fetch('https://taskflow-ai-personal.vercel.app/', {method: 'HEAD'})
  .then(response => {
    console.log('CSP Header:', response.headers.get('Content-Security-Policy'));
    return response;
  });
```

## Test 02: בדיקת CSP Meta Tag

```javascript
// ב-Browser Console:
const metaCSP = document.querySelector(
  'meta[http-equiv="Content-Security-Policy"]'
);
console.log("CSP Meta Tag:", metaCSP ? metaCSP.content : "Not found");
```

## Test 03: בדיקת Service Worker

```javascript
// ב-Browser Console:
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistration().then((reg) => {
    console.log("Service Worker:", reg ? "Registered" : "Not registered");
  });
}
```

## Test 04: בדיקת Google Auth Endpoints

```javascript
// ב-Browser Console - נסה לטעון Google Auth:
fetch("https://identitytoolkit.googleapis.com/v1/projects", { mode: "no-cors" })
  .then(() => console.log("✅ Google Identity Toolkit accessible"))
  .catch((err) => console.log("❌ Google Identity Toolkit blocked:", err));

fetch("https://securetoken.googleapis.com/v1/token", { mode: "no-cors" })
  .then(() => console.log("✅ Google Secure Token accessible"))
  .catch((err) => console.log("❌ Google Secure Token blocked:", err));
```

## Test 05: בדיקת Firebase Auth באמת

```javascript
// ב-Browser Console - נסה Firebase Auth:
import { getAuth } from "firebase/auth";
const auth = getAuth();
console.log("Firebase Auth:", auth);
```

## Expected Results:

- ✅ CSP Header קיים וכולל את כל הדומיינים של Google
- ✅ אין CSP Meta Tag שחוסם (או שהוא מכיל את הדומיינים הנכונים)
- ✅ Service Worker רשום ופעיל
- ✅ Google Auth endpoints נגישים
- ✅ Firebase Auth נטען בלי שגיאות CSP

## Manual Test:

1. לך לאתר: https://taskflow-ai-personal.vercel.app
2. פתח Developer Tools (F12)
3. הפעל את הטסטים למעלה
4. נסה להתחבר עם Google OAuth
5. בדוק אם יש שגיאות ב-Console

## זמן צפוי לטסט: 5-10 דקות
