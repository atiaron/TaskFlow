/**
 * 🔥 Firestore Rules Deployment Script
 * מפרסם את כללי האבטחה של Firestore
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Starting Firestore Rules Deployment...');

// בדיקה שיש Firebase CLI
try {
  execSync('firebase --version', { stdio: 'ignore' });
  console.log('✅ Firebase CLI found');
} catch (error) {
  console.log('⚠️ Firebase CLI not found, installing...');
  try {
    execSync('npm install -g firebase-tools', { stdio: 'inherit' });
    console.log('✅ Firebase CLI installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install Firebase CLI');
    console.error('Please install manually: npm install -g firebase-tools');
    process.exit(1);
  }
}

// בדיקה שיש קובץ rules
const rulesPath = path.join(__dirname, '..', 'firestore.rules');
if (!fs.existsSync(rulesPath)) {
  console.error('❌ firestore.rules file not found');
  process.exit(1);
}

console.log('📄 Found firestore.rules file');

// בדיקה שיש firebase.json
const firebaseConfigPath = path.join(__dirname, '..', 'firebase.json');
if (!fs.existsSync(firebaseConfigPath)) {
  console.error('❌ firebase.json not found');
  console.error('Please run: firebase init firestore');
  process.exit(1);
}

console.log('⚙️ Found firebase.json configuration');

// בדיקה שהמשתמש מחובר
try {
  execSync('firebase auth:list', { stdio: 'ignore' });
  console.log('✅ User is logged in to Firebase');
} catch (error) {
  console.log('⚠️ Not logged in to Firebase');
  console.log('Please run: firebase login');
  process.exit(1);
}

// פרסום הכללים
try {
  console.log('🚀 Deploying Firestore rules...');
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  console.log('');
  console.log('🎉 Firestore rules deployed successfully!');
  console.log('🔒 Your database is now secured with production rules.');
} catch (error) {
  console.error('❌ Failed to deploy Firestore rules');
  console.error('Error:', error.message);
  process.exit(1);
}
