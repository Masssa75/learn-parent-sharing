require('dotenv').config();

const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const SITE_ID = process.env.LEARN_NETLIFY_SITE_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function addEnvironmentVariable() {
  if (!NETLIFY_TOKEN || !SITE_ID || !GEMINI_API_KEY) {
    console.error('Missing required environment variables');
    return;
  }

  try {
    // First get account info
    console.log('Getting account info...');
    const userResponse = await fetch('https://api.netlify.com/api/v1/user', {
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userData = await userResponse.json();
    console.log('Account ID:', userData.id);

    // Create environment variable using the accounts API
    console.log('\nCreating GEMINI_API_KEY environment variable...');
    const createResponse = await fetch(`https://api.netlify.com/api/v1/accounts/${userData.id}/env`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'GEMINI_API_KEY',
        scopes: ['builds', 'functions'],
        values: [{
          value: GEMINI_API_KEY,
          context: 'all'
        }]
      })
    });

    if (createResponse.ok) {
      console.log('✅ Successfully added GEMINI_API_KEY to Netlify');
    } else if (createResponse.status === 422) {
      console.log('⚠️  GEMINI_API_KEY might already exist');
      
      // Try to update it
      const patchResponse = await fetch(`https://api.netlify.com/api/v1/accounts/${userData.id}/env/GEMINI_API_KEY`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NETLIFY_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scopes: ['builds', 'functions'],
          values: [{
            value: GEMINI_API_KEY,
            context: 'all'
          }]
        })
      });

      if (patchResponse.ok) {
        console.log('✅ Successfully updated GEMINI_API_KEY');
      } else {
        const error = await patchResponse.text();
        console.log('Failed to update:', error);
      }
    } else {
      const error = await createResponse.text();
      console.log('Failed to create:', error);
    }

    // Trigger deployment
    console.log('\nTriggering new deployment...');
    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}/builds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
      }
    });

    if (deployResponse.ok) {
      console.log('✅ Deployment triggered successfully');
      console.log('Wait 2-3 minutes for deployment to complete.');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

addEnvironmentVariable();