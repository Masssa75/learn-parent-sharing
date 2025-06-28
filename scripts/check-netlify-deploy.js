const https = require('https');
require('dotenv').config();

const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const SITE_ID = '8d8b1724-b6a0-4b98-a84e-7a8b81baf85c'; // learn-parent-sharing-app

if (!NETLIFY_AUTH_TOKEN) {
  console.error('❌ NETLIFY_AUTH_TOKEN not found in .env file');
  console.error('Please add: NETLIFY_AUTH_TOKEN=your-token-here');
  process.exit(1);
}

async function checkDeployments() {
  console.log('🔍 Checking Netlify deployments...\n');

  const options = {
    hostname: 'api.netlify.com',
    path: `/api/v1/sites/${SITE_ID}/deploys?per_page=5`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const deploys = JSON.parse(data);
          
          console.log('Recent deployments:');
          console.log('==================\n');
          
          deploys.forEach((deploy, index) => {
            const date = new Date(deploy.created_at).toLocaleString();
            const duration = deploy.deploy_time ? `${deploy.deploy_time}s` : 'N/A';
            
            console.log(`Deploy #${index + 1}:`);
            console.log(`  Status: ${deploy.state} ${getStatusEmoji(deploy.state)}`);
            console.log(`  Created: ${date}`);
            console.log(`  Duration: ${duration}`);
            console.log(`  Branch: ${deploy.branch}`);
            
            if (deploy.error_message) {
              console.log(`  ❌ Error: ${deploy.error_message}`);
            }
            
            if (deploy.state === 'building') {
              console.log(`  ⏳ Currently building...`);
            }
            
            console.log(`  URL: ${deploy.deploy_ssl_url || deploy.deploy_url}`);
            console.log(`  Admin: https://app.netlify.com/sites/${SITE_ID}/deploys/${deploy.id}`);
            console.log('');
          });

          // Check the latest deployment
          const latest = deploys[0];
          if (latest.state === 'error' || latest.state === 'failed') {
            console.log('❌ Latest deployment failed!');
            checkBuildLog(latest.id);
          } else if (latest.state === 'ready') {
            console.log('✅ Latest deployment successful!');
          }
        } else {
          console.error(`❌ API Error: ${res.statusCode} ${res.statusMessage}`);
          console.error('Response:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.end();
  });
}

async function checkBuildLog(deployId) {
  console.log('\n📜 Fetching build log...\n');

  const options = {
    hostname: 'api.netlify.com',
    path: `/api/v1/deploys/${deployId}/log`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const log = JSON.parse(data);
          
          // Find error messages in the log
          const lines = log.log.split('\n');
          const errorLines = lines.filter(line => 
            line.includes('error') || 
            line.includes('Error') || 
            line.includes('failed') ||
            line.includes('Failed')
          );
          
          if (errorLines.length > 0) {
            console.log('Error lines from build log:');
            console.log('==========================');
            errorLines.forEach(line => console.log(line));
          } else {
            console.log('Full build log:');
            console.log('===============');
            console.log(log.log);
          }
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      resolve();
    });

    req.end();
  });
}

function getStatusEmoji(state) {
  switch(state) {
    case 'ready': return '✅';
    case 'error': 
    case 'failed': return '❌';
    case 'building': return '🔨';
    case 'enqueued': return '⏳';
    default: return '❓';
  }
}

// Run the check
checkDeployments().catch(console.error);