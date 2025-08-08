/* cspell:disable */
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// הגדרות Firebase - השתמש בהגדרות מוכנות לפיתוח
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAVm4-D1EnSJTbIEnDIyLsX4Aeyz1c7v0E",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "task-flow-lac-three.vercel.app",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "taskflow-atiaron",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "taskflow-atiaron.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "244419897641",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:244419897641:web:eb3afd42a106cdc95fef38"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth  
export const auth = getAuth(app);

// בדיקה אם אנחנו ב-development ובlocalhost - רק אז נשתמש בemulator
const useEmulators = process.env.REACT_APP_USE_EMULATORS === '1';

if (useEmulators) {
  try {
    // התחבר לFirestore Emulator - port 8084 (מעודכן)
    connectFirestoreEmulator(db, 'localhost', 8084);
    
    // הגדרות נוספות ל-Firestore emulator
    if (typeof window !== 'undefined') {
      // @ts-ignore - הגדרות פנימיות של Firebase
      window.FIRESTORE_EMULATOR_HOST = 'localhost:8084';
    }
    
    // התחבר לAuth Emulator
    connectAuthEmulator(auth, 'http://localhost:9099');
    
    console.log('🔧 DEV: Firebase Emulators enabled (Auth: 9099, Firestore: 8084)');
    console.warn("⚠️ Auth Emulator is active - this is normal in development");
  } catch (error) {
    console.log('⚠️ Emulators not available, using production Firebase');
    console.log('🔍 Error details:', error);
    
    // אם האמולטור לא זמין, נמשיך עם Firebase רגיל
    console.log('🌐 Falling back to production Firebase for development');
  }
} else {
  console.log('🚀 Using production Firebase');
}

export default app;