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
    // Get current environment variables
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}`, {
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get site: ${response.statusText}`);
    }

    const site = await response.json();
    const currentEnvVars = site.build_settings?.env || {};

    // Add GEMINI_API_KEY
    const updatedEnvVars = {
      ...currentEnvVars,
      GEMINI_API_KEY: GEMINI_API_KEY
    };

    // Update site with new environment variables
    const updateResponse = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        build_settings: {
          ...site.build_settings,
          env: updatedEnvVars
        }
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to update site: ${error}`);
    }

    console.log('✅ Successfully added GEMINI_API_KEY to Netlify');
    console.log('The site will use the new environment variable on the next build.');
    
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
    } else {
      console.log('⚠️  Could not trigger deployment automatically');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

addEnvironmentVariable();