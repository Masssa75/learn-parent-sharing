const fetch = require('node-fetch');
require('dotenv').config();

const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;
const SITE_ID = process.env.LEARN_NETLIFY_SITE_ID || '8d8b1724-b6a0-4b98-a84e-7a8b81baf85c';

async function checkFunctionLogs() {
  console.log('🔍 Checking Netlify function logs...\n');
  
  try {
    // Get recent deploys
    const deploysResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${SITE_ID}/deploys?per_page=1`,
      {
        headers: {
          'Authorization': `Bearer ${NETLIFY_TOKEN}`
        }
      }
    );
    
    const deploys = await deploysResponse.json();
    
    if (deploys.length > 0) {
      const latestDeploy = deploys[0];
      console.log(`Latest deploy: ${latestDeploy.id}`);
      console.log(`Status: ${latestDeploy.state}`);
      console.log(`Created: ${new Date(latestDeploy.created_at).toLocaleString()}`);
      
      // Try to get function logs
      console.log('\nAttempting to get function logs...');
      const logsResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${SITE_ID}/functions/logs`,
        {
          headers: {
            'Authorization': `Bearer ${NETLIFY_TOKEN}`
          }
        }
      );
      
      if (logsResponse.ok) {
        const logs = await logsResponse.json();
        console.log('Function logs:', logs);
      } else {
        console.log('Note: Function logs might not be available via API');
        console.log('You can view them at: https://app.netlify.com/sites/learn-parent-sharing-app/functions');
      }
    }
  } catch (error) {
    console.error('Error checking logs:', error.message);
  }
}

checkFunctionLogs().catch(console.error);