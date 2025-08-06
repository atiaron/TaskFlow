/* cspell:disable */
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// הגדרות Firebase - השתמש בהגדרות מוכנות לפיתוח
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAVm4-D1EnSJTbIEnDIyLsX4Aeyz1c7v0E",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "taskflow-atiaron.firebaseapp.com",
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

// בדיקה אם אנחנו ב-development - נוכל להשתמש בemulator
if (process.env.NODE_ENV === 'development' && !window.location.hostname.includes('firebase')) {
  try {
    // התחבר לFirestore Emulator
    connectFirestoreEmulator(db, 'localhost', 8081);
    
    // התחבר לAuth Emulator
    connectAuthEmulator(auth, 'http://localhost:9099');
    
    console.log('🔧 Connected to Firebase Emulators @ localhost:8081');
  } catch (error) {
    console.log('⚠️ Emulators not available, using production Firebase');
  }
}

export default app;