const https = require('https');
require('dotenv').config();

const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const SITE_ID = '8d8b1724-b6a0-4b98-a84e-7a8b81baf85c';

console.log('🚀 Triggering Netlify deployment...\n');

const options = {
  hostname: 'api.netlify.com',
  path: `/api/v1/sites/${SITE_ID}/builds`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 201 || res.statusCode === 200) {
      const build = JSON.parse(data);
      console.log('✅ Deployment triggered successfully!');
      console.log(`Build ID: ${build.id}`);
      console.log(`Status: ${build.state}`);
      console.log(`\nCheck progress at:`);
      console.log(`https://app.netlify.com/sites/learn-parent-sharing-app/deploys/${build.id}`);
    } else {
      console.error(`❌ Failed to trigger deployment: ${res.statusCode}`);
      console.error('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();