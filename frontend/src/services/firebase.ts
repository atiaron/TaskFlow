import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAVm4-D1EnSJTbIEnDIyLsX4Aeyz1c7v0E",
  authDomain: "taskflow-atiaron.firebaseapp.com",
  projectId: "taskflow-atiaron",
  storageBucket: "taskflow-atiaron.firebasestorage.app",
  messagingSenderId: "244419897641",
  appId: "1:244419897641:web:eb3afd42a106cdc95fef38"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;