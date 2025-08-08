// quick-test.js - Simple test for Task 5
console.log('Testing Task 5 implementation...');

const http = require('http');

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  try {
    console.log('\n1. Testing /api/health (should work)...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3333,
      path: '/api/health',
      method: 'GET'
    });
    console.log(`Health: ${healthResponse.status} - ${healthResponse.body.substring(0, 50)}...`);
    
    console.log('\n2. Testing trust proxy setting...');
    console.log('Check server logs for: 🔐 trust proxy = false (in dev mode)');
    
    console.log('\n3. Testing rate limiting (should work in dev with high limits)...');
    for (let i = 1; i <= 3; i++) {
      const authResponse = await makeRequest({
        hostname: 'localhost',
        port: 3333,
        path: '/api/auth/exchange',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(`Auth Exchange ${i}: ${authResponse.status}`);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

test();
