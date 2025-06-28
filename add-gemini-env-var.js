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
    // First, check if the env var already exists
    console.log('Checking existing environment variables...');
    const getResponse = await fetch(`https://api.netlify.com/api/v1/accounts/marcschwyn/env?site_id=${SITE_ID}`, {
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
      }
    });

    if (getResponse.ok) {
      const envVars = await getResponse.json();
      const existingGemini = envVars.find(v => v.key === 'GEMINI_API_KEY');
      
      if (existingGemini) {
        console.log('GEMINI_API_KEY already exists, updating...');
        // Update existing
        const updateResponse = await fetch(`https://api.netlify.com/api/v1/accounts/marcschwyn/env/${existingGemini.key}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${NETLIFY_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            context_parameter: 'site_id',
            context: SITE_ID,
            value: GEMINI_API_KEY
          })
        });

        if (updateResponse.ok) {
          console.log('✅ Successfully updated GEMINI_API_KEY');
        } else {
          throw new Error(`Failed to update: ${await updateResponse.text()}`);
        }
      } else {
        console.log('Creating new GEMINI_API_KEY...');
        // Create new
        const createResponse = await fetch(`https://api.netlify.com/api/v1/accounts/marcschwyn/env`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NETLIFY_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'GEMINI_API_KEY',
            scopes: ['builds', 'functions'],
            values: [{
              context_parameter: 'site_id',
              context: SITE_ID,
              value: GEMINI_API_KEY
            }]
          })
        });

        if (createResponse.ok) {
          console.log('✅ Successfully added GEMINI_API_KEY to Netlify');
        } else {
          throw new Error(`Failed to create: ${await createResponse.text()}`);
        }
      }
    }

    // Trigger a new deployment
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
    } else {
      console.log('⚠️  Could not trigger deployment automatically');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

addEnvironmentVariable();