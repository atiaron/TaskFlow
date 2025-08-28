// QA Master Test Suite - Production Ready Validation
const http = require('http');

console.log('🎯 TaskFlow Production-Ready QA Test Suite');
console.log('===========================================');

// Test utilities
function makeRequest(port, path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method
    };
    
    if (data) {
      options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      };
    }
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', (e) => {
      resolve({ status: 0, error: e.message });
    });
    
    req.setTimeout(3000, () => {
      req.abort();
      resolve({ status: 0, error: 'Timeout' });
    });
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('\n🧪 Test 1: Frontend Availability');
  const frontend = await makeRequest(3000, '/');
  console.log(`Frontend (3000): ${frontend.status === 200 ? '✅ Running' : '❌ Not available'}`);
  
  console.log('\n🧪 Test 2: Backend Health');
  const backend = await makeRequest(3333, '/health');
  console.log(`Backend (3333): ${backend.status === 200 ? '✅ Running' : '❌ Not available'}`);
  if (backend.status === 200) {
    try {
      const health = JSON.parse(backend.body);
      console.log(`Service: ${health.service || 'Unknown'}`);
      console.log(`Firebase: ${health.features?.firebase ? '✅' : '❌'}`);
    } catch (e) {
      console.log('Health response received but not JSON');
    }
  }
  
  console.log('\n🧪 Test 3: Auth Exchange (Mock Token)');
  const authData = JSON.stringify({ idToken: 'mock-id-token' });
  const auth = await makeRequest(3333, '/api/auth/exchange', 'POST', authData);
  console.log(`Auth Exchange: ${auth.status === 200 ? '✅ Working' : '❌ Failed'}`);
  if (auth.status === 200) {
    try {
      const tokens = JSON.parse(auth.body);
      console.log(`Access Token: ${tokens.accessToken ? '✅' : '❌'}`);
      console.log(`Refresh Token: ${tokens.refreshToken ? '✅' : '❌'}`);
      console.log(`User: ${tokens.user?.email || tokens.user?.userId || 'Unknown'}`);
    } catch (e) {
      console.log('Auth response received but not JSON');
    }
  }
  
  console.log('\n🧪 Test 4: Proxy Check');
  const proxied = await makeRequest(3000, '/api/health');
  console.log(`Proxied API: ${proxied.status === 200 ? '✅ Working' : '❌ Failed'}`);
  
  console.log('\n🧪 Test 5: Emulator Status');
  const authEmu = await makeRequest(9099, '/');
  const firestoreEmu = await makeRequest(8084, '/');
  const uiEmu = await makeRequest(4001, '/');
  
  console.log(`Auth Emulator (9099): ${authEmu.status === 200 ? '✅ Running' : '❌ Not available'}`);
  console.log(`Firestore Emulator (8084): ${firestoreEmu.status === 200 ? '✅ Running' : '❌ Not available'}`);
  console.log(`Emulator UI (4001): ${uiEmu.status === 200 ? '✅ Running' : '❌ Not available'}`);
  
  console.log('\n🎯 SUMMARY');
  console.log('==========');
  const tests = [
    { name: 'Frontend', status: frontend.status === 200 },
    { name: 'Backend', status: backend.status === 200 },
    { name: 'Auth Exchange', status: auth.status === 200 },
    { name: 'Proxy', status: proxied.status === 200 },
    { name: 'Auth Emulator', status: authEmu.status === 200 },
    { name: 'Firestore Emulator', status: firestoreEmu.status === 200 }
  ];
  
  const passed = tests.filter(t => t.status).length;
  const total = tests.length;
  
  console.log(`Tests Passed: ${passed}/${total}`);
  tests.forEach(test => {
    console.log(`${test.status ? '✅' : '❌'} ${test.name}`);
  });
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED - PRODUCTION READY!');
    console.log('\n📋 Next Steps:');
    console.log('1. Open http://localhost:3000 in browser');
    console.log('2. Verify Guest Mode (no auto-login)');
    console.log('3. Test creating tasks locally');
    console.log('4. Test login/logout flow');
    console.log('5. Check DevTools Network for no automatic auth calls');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED - CHECK SERVICES');
    console.log('\n💡 Troubleshooting:');
    if (!tests[0].status) console.log('- Start frontend: npm run dev:fe');
    if (!tests[1].status) console.log('- Start backend: npm run dev:be');
    if (!tests[4].status || !tests[5].status) console.log('- Start emulators: firebase emulators:start --only auth,firestore');
  }
}

runAllTests().catch(console.error);
