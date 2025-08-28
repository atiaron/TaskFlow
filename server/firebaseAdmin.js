const admin = require('firebase-admin');

if (!admin.apps.length) {
  const isDev = process.env.NODE_ENV === 'development';
  const useEmu = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
  
  if (isDev && !useEmu) {
    console.log('🔧 Firebase Admin: Skipping initialization in development mode');
    console.log('💡 Set FIREBASE_AUTH_EMULATOR_HOST to use emulator mode');
    // Don't initialize Firebase Admin in dev mode without emulator
  } else if (useEmu) {
    console.log('🔧 Firebase Admin: Using Emulator Mode');
    // Dev: אמולטור – בלי אישורים רגישים
    admin.initializeApp({ 
      projectId: process.env.FIREBASE_PROJECT_ID || 'taskflow-atiaron'
    });
  } else {
    console.log('🔧 Firebase Admin: Using Production Mode');
    // Prod: Service Account מתוך ENV
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    
    if (!projectId || !clientEmail || !privateKey) {
      console.error('❌ Missing Firebase Admin credentials for production');
      console.log('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
      process.exit(1);
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({ 
        projectId, 
        clientEmail, 
        privateKey 
      }),
    });
  }
  
  if (admin.apps.length > 0) {
    console.log('✅ Firebase Admin initialized successfully');
  }
}

module.exports = admin;
