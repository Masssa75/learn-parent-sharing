const https = require('https');
require('dotenv').config();

const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const SITE_ID = '8d8b1724-b6a0-4b98-a84e-7a8b81baf85c';

if (!NETLIFY_AUTH_TOKEN) {
  console.error('❌ NETLIFY_AUTH_TOKEN not found in .env file');
  process.exit(1);
}

async function getLatestFailedDeploy() {
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
          
          // Find the latest failed deployment
          const failedDeploy = deploys.find(d => d.state === 'error' || d.state === 'failed');
          
          if (failedDeploy) {
            console.log(`📍 Found failed deployment: ${failedDeploy.id}`);
            console.log(`   Created: ${new Date(failedDeploy.created_at).toLocaleString()}`);
            console.log(`   Error: ${failedDeploy.error_message}\n`);
            resolve(failedDeploy.id);
          } else {
            console.log('✅ No recent failed deployments found');
            resolve(null);
          }
        } else {
          reject(new Error(`API Error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function getBuildLog(deployId) {
  console.log('📜 Fetching full build log...\n');

  const options = {
    hostname: 'api.netlify.com',
    path: `/api/v1/deploys/${deployId}/log`,
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
          const logData = JSON.parse(data);
          
          // Print the full log
          console.log('='.repeat(80));
          console.log('FULL BUILD LOG:');
          console.log('='.repeat(80));
          console.log(logData.log);
          console.log('='.repeat(80));
          
          // Also extract and highlight error lines
          const lines = logData.log.split('\n');
          const errorLines = lines.filter(line => 
            line.toLowerCase().includes('error') || 
            line.toLowerCase().includes('failed') ||
            line.includes('✘') ||
            line.includes('npm ERR!')
          );
          
          if (errorLines.length > 0) {
            console.log('\n❌ ERROR SUMMARY:');
            console.log('='.repeat(80));
            errorLines.forEach(line => console.log(line));
            console.log('='.repeat(80));
          }
          
          resolve();
        } else {
          reject(new Error(`Failed to fetch log: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Main execution
async function main() {
  try {
    const deployId = await getLatestFailedDeploy();
    if (deployId) {
      await getBuildLog(deployId);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();