const https = require('https');

console.log('Testing dev login with password...\n');

const data = JSON.stringify({
  password: 'test-learn-2025'
});

const options = {
  hostname: 'learn-parent-sharing-app.netlify.app',
  port: 443,
  path: '/api/auth/dev-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(responseData);
      console.log('\nResponse:', JSON.stringify(json, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n✅ SUCCESS! Test user logged in!');
        console.log('User:', json.user);
        
        // Check if we got a session cookie
        const cookies = res.headers['set-cookie'];
        if (cookies) {
          console.log('\n✅ Session cookie set!');
        }
      } else if (res.statusCode === 403) {
        console.log('\n❌ Dev login disabled - need to set ALLOW_DEV_LOGIN=true on Netlify');
      } else if (res.statusCode === 401) {
        console.log('\n❌ Invalid password');
      } else if (res.statusCode === 404) {
        console.log('\n❌ Test user not found in database');
      }
    } catch (e) {
      console.log('\nRaw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(data);
req.end();