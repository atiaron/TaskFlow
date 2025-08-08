// QA Test 1: Guest Mode without Auto-Login
const http = require('http');

console.log('🧪 Test 1: Guest Mode without Auto-Login');
console.log('Testing: http://localhost:3000 should NOT auto-login');

// Test if frontend loads without auto-login
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
  headers: {
    'User-Agent': 'QA-Test-Guest-Mode'
  }
};

const req = http.request(options, (res) => {
  console.log(`✅ Frontend Status: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    // Check if page loads (should be HTML)
    if (body.includes('<html') || body.includes('<!DOCTYPE')) {
      console.log('✅ Frontend loads successfully');
      
      // Now test if there's NO automatic auth/exchange call
      console.log('\n🔍 Next: Open http://localhost:3000 in browser');
      console.log('📋 Expected Results:');
      console.log('   - UI shows Guest Mode (no logged-in user)');
      console.log('   - DevTools Network: NO POST /api/auth/exchange');
      console.log('   - Can create tasks locally');
    } else {
      console.log('❌ Frontend not responding correctly');
      console.log('Body preview:', body.substring(0, 200));
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Frontend Error: ${e.message}`);
  console.log('💡 Make sure frontend is running on port 3000');
});

req.setTimeout(5000, () => {
  console.log('⏰ Frontend request timeout');
  req.abort();
});

req.end();
