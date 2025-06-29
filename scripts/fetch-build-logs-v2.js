const fetch = require('node-fetch');
require('dotenv').config();

const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const SITE_ID = '8d8b1724-b6a0-4b98-a84e-7a8b81baf85c';

async function fetchBuildLogs() {
  try {
    // First, get the latest deploys
    const deploysResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${SITE_ID}/deploys?per_page=10`,
      {
        headers: {
          'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`
        }
      }
    );

    if (!deploysResponse.ok) {
      throw new Error(`Failed to fetch deploys: ${deploysResponse.status}`);
    }

    const deploys = await deploysResponse.json();
    
    // Find the latest failed deployment
    const failedDeploy = deploys.find(d => d.state === 'error' || d.state === 'failed');
    
    if (!failedDeploy) {
      console.log('✅ No recent failed deployments found');
      return;
    }

    console.log(`📍 Found failed deployment: ${failedDeploy.id}`);
    console.log(`   Created: ${new Date(failedDeploy.created_at).toLocaleString()}`);
    console.log(`   Branch: ${failedDeploy.branch}`);
    console.log(`   Error: ${failedDeploy.error_message}\n`);

    // Try different log endpoints
    const logEndpoints = [
      `/api/v1/deploys/${failedDeploy.id}/log`,
      `/api/v1/builds/${failedDeploy.build_id}/log`,
      `/api/v1/sites/${SITE_ID}/builds/${failedDeploy.build_id}/log`
    ];

    for (const endpoint of logEndpoints) {
      console.log(`Trying endpoint: ${endpoint}`);
      
      try {
        const logResponse = await fetch(
          `https://api.netlify.com${endpoint}`,
          {
            headers: {
              'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
              'Accept': 'application/json'
            }
          }
        );

        if (logResponse.ok) {
          const logData = await logResponse.json();
          console.log('\n📜 BUILD LOG:');
          console.log('='.repeat(80));
          
          if (logData.log) {
            console.log(logData.log);
          } else if (logData.message) {
            console.log(logData.message);
          } else {
            console.log(JSON.stringify(logData, null, 2));
          }
          
          console.log('='.repeat(80));
          return;
        }
      } catch (e) {
        // Try next endpoint
      }
    }

    // If we can't get the log via API, check the deploy details
    console.log('\n📋 Deploy Details:');
    console.log(JSON.stringify(failedDeploy, null, 2));
    
    console.log('\n💡 You can view the full build log at:');
    console.log(`   https://app.netlify.com/sites/${SITE_ID}/deploys/${failedDeploy.id}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fetchBuildLogs();