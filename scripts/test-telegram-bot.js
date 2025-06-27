const https = require('https');

const BOT_TOKEN = '7807046295:AAGAK8EgrwpYod7R06MLq6rfigvm-6HJ3eY';

function testBot() {
  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${BOT_TOKEN}/getMe`,
    method: 'GET'
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const response = JSON.parse(data);
      
      if (response.ok) {
        console.log('✅ Bot is valid!');
        console.log('Bot info:', response.result);
        console.log(`Username: @${response.result.username}`);
      } else {
        console.log('❌ Bot token is invalid or bot does not exist');
        console.log('Error:', response.description);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.end();
}

console.log('Testing Telegram bot...');
testBot();