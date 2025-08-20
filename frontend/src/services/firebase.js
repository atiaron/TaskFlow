import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Check if we're in development environment 
const isDevelopment = process.env.NODE_ENV === 'development';

// In development, always use a mock Firebase configuration
// In production, use environment variables
const firebaseConfig = isDevelopment ? {
  // Mock configuration that doesn't require real credentials
  apiKey: 'demo-api-key',
  authDomain: 'demo-app.firebaseapp.com',
  projectId: 'demo-project',
  storageBucket: 'demo-project.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890'
} : {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Log configuration in development mode
if (isDevelopment) {
  console.log('Development mode: Using mock Firebase configuration');
}

// Initialize Firebase with the appropriate configuration
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  if (!isDevelopment) {
    // In production, show error details
    console.error('Firebase config error details:', error);
  }
}

// Export auth services
export const auth = getAuth(app);
export default app;