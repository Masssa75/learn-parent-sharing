const https = require('https');

async function testActionsAPI() {
  console.log('Testing Actions API directly...\n');
  
  // First, get a session by logging in
  console.log('1. Logging in as devtest...');
  
  const loginData = JSON.stringify({
    telegramId: 999999999,
    password: 'test-learn-2025'
  });
  
  const loginOptions = {
    hostname: 'learn-parent-sharing-app.netlify.app',
    path: '/api/auth/dev-login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };
  
  const sessionCookie = await new Promise((resolve, reject) => {
    const req = https.request(loginOptions, (res) => {
      let data = '';
      let cookie = '';
      
      // Get the session cookie
      const setCookieHeader = res.headers['set-cookie'];
      if (setCookieHeader) {
        const sessionCookie = setCookieHeader.find(c => c.startsWith('session='));
        if (sessionCookie) {
          cookie = sessionCookie.split(';')[0];
        }
      }
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 302 || res.statusCode === 200) {
          console.log('✅ Login successful');
          console.log(`   Cookie: ${cookie}`);
          resolve(cookie);
        } else {
          console.log(`❌ Login failed: ${res.statusCode}`);
          console.log(`   Response: ${data}`);
          resolve(null);
        }
      });
    });
    
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
  
  if (!sessionCookie) {
    console.log('Failed to get session cookie');
    return;
  }
  
  // Now test the actions API
  console.log('\n2. Testing actions API...');
  
  const actionData = JSON.stringify({
    actionType: 'add_to_profile',
    targetType: 'post',
    targetId: '52cf556c-5cd1-4cf4-bdf6-9020f0510e3d'
  });
  
  const actionOptions = {
    hostname: 'learn-parent-sharing-app.netlify.app',
    path: '/api/actions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': actionData.length,
      'Cookie': sessionCookie
    }
  };
  
  const actionReq = https.request(actionOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Response: ${data}`);
      
      try {
        const parsed = JSON.parse(data);
        console.log('\n   Parsed response:');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        // Not JSON
      }
    });
  });
  
  actionReq.on('error', (error) => {
    console.error('Request error:', error);
  });
  
  actionReq.write(actionData);
  actionReq.end();
}

testActionsAPI();