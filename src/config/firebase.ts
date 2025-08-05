import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// הגדרות Firebase - תעדכן עם הנתונים שלך מהconsole
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "taskflow-atiaron.firebaseapp.com",
  projectId: "taskflow-atiaron",
  storageBucket: "taskflow-atiaron.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id-here"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// בדיקה אם אנחנו ב-development - נוכל להשתמש בemulator
if (process.env.NODE_ENV === 'development' && !window.location.hostname.includes('firebase')) {
  try {
    // התחבר לFirestore Emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    
    // התחבר לAuth Emulator
    connectAuthEmulator(auth, 'http://localhost:9099');
    
    console.log('🔧 Connected to Firebase Emulators');
  } catch (error) {
    console.log('⚠️ Emulators not available, using production Firebase');
  }
}

export default app;