// test-task5.js - Task 5 Rate Limiting Tests
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3333';

async function testHealthEndpoint() {
  console.log('\n🧪 Test 1: Health Endpoint (No Rate Limit)');
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      console.log(`Request ${i}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`Request ${i}: Error - ${error.message}`);
    }
  }
}

async function testAuthExchangeRateLimit() {
  console.log('\n🧪 Test 2: Auth Exchange Rate Limiting (Dev = high limit)');
  
  // במצב dev הגבול הוא 100 בקשות לדקה, אז נבדוק 10 בקשות
  for (let i = 1; i <= 10; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'invalid-token' })
      });
      
      const data = await response.json();
      console.log(`Request ${i}: ${response.status} - ${data.error || data.message || 'OK'}`);
      
      if (response.status === 429) {
        console.log(`🚨 Rate limit hit at request ${i}!`);
        break;
      }
    } catch (error) {
      console.log(`Request ${i}: Error - ${error.message}`);
    }
    
    // קצת השהיה בין הבקשות
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function testAuthRefreshRateLimit() {
  console.log('\n🧪 Test 3: Auth Refresh Rate Limiting');
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'invalid-token' })
      });
      
      const data = await response.json();
      console.log(`Request ${i}: ${response.status} - ${data.error || data.message || 'OK'}`);
      
      if (response.status === 429) {
        console.log(`🚨 Rate limit hit at request ${i}!`);
        break;
      }
    } catch (error) {
      console.log(`Request ${i}: Error - ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function testOptionsNotRateLimited() {
  console.log('\n🧪 Test 4: OPTIONS (Preflight) Not Rate Limited');
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/exchange`, {
        method: 'OPTIONS'
      });
      console.log(`OPTIONS ${i}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`OPTIONS ${i}: Error - ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Task 5 - Rate Limiting Tests');
  console.log('================================');
  
  try {
    await testHealthEndpoint();
    await testAuthExchangeRateLimit();
    await testAuthRefreshRateLimit();
    await testOptionsNotRateLimited();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📋 Summary:');
    console.log('- Health endpoint should NOT be rate limited');
    console.log('- Auth endpoints should be rate limited');
    console.log('- OPTIONS requests should NOT be rate limited');
    console.log('- Dev mode: generous limits (100/min)');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

main();
