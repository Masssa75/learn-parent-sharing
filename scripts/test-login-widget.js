const https = require('https');

// Test if the login page loads correctly
function testLoginPage() {
  const options = {
    hostname: 'learn-parent-sharing-app.netlify.app',
    path: '/login',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      
      // Check if the page contains the Telegram widget script
      if (data.includes('telegram-widget.js')) {
        console.log('✅ Telegram widget script found');
      } else {
        console.log('❌ Telegram widget script NOT found');
      }
      
      // Check for the bot username
      if (data.includes('learn_notification_bot')) {
        console.log('✅ Correct bot username found: learn_notification_bot');
      } else if (data.includes('LearnParentBot')) {
        console.log('❌ Old bot username still present: LearnParentBot');
      } else {
        console.log('❌ No bot username found');
      }
      
      // Check if login component is present
      if (data.includes('TelegramLogin')) {
        console.log('✅ TelegramLogin component rendered');
      }
      
      // Save the response for debugging
      require('fs').writeFileSync('login-page-test.html', data);
      console.log('\nFull response saved to login-page-test.html');
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.end();
}

console.log('Testing login page at https://learn-parent-sharing-app.netlify.app/login\n');
testLoginPage();