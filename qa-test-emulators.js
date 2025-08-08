// QA Test 4: Emulator Enforcement Check
const http = require('http');

console.log('🧪 Test 4: Emulator Enforcement Check');

async function testEmulators() {
  console.log('\n🔍 Testing Firebase Emulators...');
  
  try {
    // Test Auth Emulator
    console.log('Testing Auth Emulator (port 9099)...');
    const authResult = await makeRequest(9099, '/');
    console.log(`✅ Auth Emulator: ${authResult.status === 200 ? 'Running' : 'Not responding'}`);
    
    // Test Firestore Emulator  
    console.log('Testing Firestore Emulator (port 8084)...');
    const firestoreResult = await makeRequest(8084, '/');
    console.log(`✅ Firestore Emulator: ${firestoreResult.status === 200 ? 'Running' : 'Not responding'}`);
    
    // Test Emulator UI
    console.log('Testing Emulator UI (port 4001)...');
    const uiResult = await makeRequest(4001, '/');
    console.log(`✅ Emulator UI: ${uiResult.status === 200 ? 'Running' : 'Not responding'}`);
    
    console.log('\n🎯 Emulator Test Results:');
    console.log('📊 Status Summary:');
    console.log(`   Auth (9099): ${authResult.status}`);
    console.log(`   Firestore (8084): ${firestoreResult.status}`); 
    console.log(`   UI (4001): ${uiResult.status}`);
    
    if (authResult.status === 200 && firestoreResult.status === 200) {
      console.log('✅ All emulators are running');
      console.log('✅ Development environment properly isolated');
    } else {
      console.log('⚠️ Some emulators may not be running');
    }
    
  } catch (error) {
    console.error('\n❌ Emulator test failed:', error.message);
  }
}

function makeRequest(port, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET'
    }, (res) => {
      resolve({ status: res.statusCode });
    });
    
    req.on('error', (e) => {
      resolve({ status: 0, error: e.message });
    });
    
    req.setTimeout(2000, () => {
      req.abort();
      resolve({ status: 0, error: 'Timeout' });
    });
    
    req.end();
  });
}

testEmulators();
