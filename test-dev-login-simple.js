const https = require('https');

console.log('Testing dev login with real test user...\n');

const data = JSON.stringify({});

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
  console.log(`Status Message: ${res.statusMessage}`);
  
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
        console.log('User ID:', json.user.id);
        console.log('Username:', json.user.username);
        console.log('\nYou can now test the full flow!');
      } else if (res.statusCode === 403) {
        console.log('\n❌ ALLOW_DEV_LOGIN needs to be set to "true" on Netlify');
      } else if (res.statusCode === 404) {
        console.log('\n❌ Test user not found, but we just created it!');
        console.log('This might be a database connection issue.');
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