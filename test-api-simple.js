// Simple test of the dev login endpoint
const https = require('https');

const testDevLogin = () => {
  console.log('Testing dev login endpoint...\n');
  
  const options = {
    hostname: 'learn-parent-sharing-app.netlify.app',
    path: '/api/auth/dev-login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      
      try {
        const json = JSON.parse(data);
        console.log('Response:', JSON.stringify(json, null, 2));
        
        if (res.statusCode === 403) {
          console.log('\n⚠️  Dev login is disabled');
          console.log('You need to set ALLOW_DEV_LOGIN=true in Netlify environment variables');
        } else if (res.statusCode === 404) {
          console.log('\n⚠️  Test user not found');
          console.log('Please create a user in Supabase with telegram_id: 999999999');
        } else if (res.statusCode === 200) {
          console.log('\n✅ Dev login successful!');
        }
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });
  
  req.on('error', (err) => {
    console.log('Request failed:', err.message);
  });
  
  req.end();
};

testDevLogin();