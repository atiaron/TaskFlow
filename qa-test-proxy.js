// QA Test 3: Proxy Test (502 Sanity Check)
const http = require('http');

console.log('🧪 Test 3: Proxy Test (502 Sanity Check)');

// Test direct backend vs proxied
async function testProxy() {
  console.log('\n🔍 Testing Direct Backend (port 3333)...');
  
  try {
    // Test 1: Direct backend
    const directResult = await makeRequest(3333, '/api/health');
    console.log(`✅ Direct Backend: ${directResult.status}`);
    
    // Test 2: Proxied through frontend
    console.log('\n🔍 Testing Proxied Backend (through port 3000)...');
    const proxiedResult = await makeRequest(3000, '/api/health');
    console.log(`✅ Proxied Backend: ${proxiedResult.status}`);
    
    // Compare results
    if (directResult.status === 200 && proxiedResult.status === 200) {
      console.log('\n🎯 Proxy Test Results:');
      console.log('✅ Direct backend works');
      console.log('✅ Proxy routing works');
      console.log('✅ No 502 Gateway errors');
    } else {
      console.log('\n❌ Proxy issues detected:');
      console.log(`Direct: ${directResult.status}, Proxied: ${proxiedResult.status}`);
    }
    
  } catch (error) {
    console.error('\n❌ Proxy test failed:', error.message);
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
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: body
        });
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.setTimeout(3000, () => {
      req.abort();
      reject(new Error(`Timeout on port ${port}`));
    });
    
    req.end();
  });
}

testProxy();
