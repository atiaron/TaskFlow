// טסט מהיר לבדיקת 502 ב-Auth Exchange
const http = require('http'); // FIXED: http לא https

console.log('🔍 Testing /health first...');

// בדיקה ראשונית של health
const healthReq = http.request({
  hostname: 'localhost',
  port: 3333,
  path: '/health',
  method: 'GET'
}, (res) => {
  console.log(`✅ Health Status: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('📦 Health Response:', body);
    
    // עכשיו נטסט את auth/exchange
    testAuthExchange();
  });
});

healthReq.on('error', (e) => {
  console.error(`❌ Health Error: ${e.message}`);
  process.exit(1);
});

healthReq.end();

function testAuthExchange() {
  console.log('\n🔍 Testing /api/auth/exchange...');
  
  const data = JSON.stringify({
    idToken: 'mock-id-token'
  });

  const options = {
    hostname: 'localhost',
    port: 3333,
    path: '/api/auth/exchange',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Auth Status: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log('📦 Auth Response:', body);
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Auth Error: ${e.message}`);
    process.exit(1);
  });

  // Timeout
  setTimeout(() => {
    console.log('⏰ Auth request timeout');
    req.abort();
    process.exit(1);
  }, 5000);

  req.write(data);
  req.end();
}
