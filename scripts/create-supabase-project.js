const https = require('https');
require('dotenv').config();

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_6f04b779bfc9e9fb52600595aabdfb3545a84add';
const SUPABASE_API_URL = 'api.supabase.com';

function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function createProject() {
  console.log('Creating new Supabase project: learn-parent-sharing...');
  
  try {
    // First, get organizations
    console.log('Getting organizations...');
    const orgs = await httpsRequest({
      hostname: SUPABASE_API_URL,
      path: '/v1/organizations',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!orgs || orgs.length === 0) {
      throw new Error('No organizations found');
    }
    
    const orgId = orgs[0].id;
    console.log(`Using organization: ${orgs[0].name} (${orgId})`);
    
    // Create the project
    const projectData = {
      name: 'learn-parent-sharing',
      organization_id: orgId,
      plan: 'free',
      region: 'eu-central-1',
      db_pass: generatePassword()
    };
    
    console.log('Creating project...');
    const project = await httpsRequest({
      hostname: SUPABASE_API_URL,
      path: '/v1/projects',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }, projectData);
    
    console.log('Project created successfully!');
    console.log(`Project ID: ${project.id}`);
    console.log(`Project URL: https://${project.id}.supabase.co`);
    
    // Wait for project to be ready
    console.log('Waiting for project to be ready...');
    await waitForProject(project.id);
    
    // Get the API keys
    console.log('Getting API keys...');
    const keys = await httpsRequest({
      hostname: SUPABASE_API_URL,
      path: `/v1/projects/${project.id}/api-keys`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n=== IMPORTANT: Save these credentials ===');
    console.log(`NEXT_PUBLIC_SUPABASE_URL=https://${project.id}.supabase.co`);
    console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${keys.anon_key}`);
    console.log(`SUPABASE_SERVICE_ROLE_KEY=${keys.service_role_key}`);
    console.log(`SUPABASE_PROJECT_ID=${project.id}`);
    console.log(`Database Password: ${projectData.db_pass}`);
    console.log('=======================================\n');
    
    // Update .env file
    const envContent = `# Learn - Parent Sharing Platform - Environment Variables

# Supabase Configuration (New Project)
NEXT_PUBLIC_SUPABASE_URL=https://${project.id}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${keys.anon_key}
SUPABASE_SERVICE_ROLE_KEY=${keys.service_role_key}
SUPABASE_PROJECT_ID=${project.id}

# Telegram Bot
TELEGRAM_BOT_TOKEN=7807046295:AAGAK8EgrwpYod7R06MLq6rfigvm-6HJ3eY
TELEGRAM_BOT_USERNAME=LearnParentBot

# External APIs (if needed)
GEMINI_API_KEY=AIzaSyAYjcirO-HOtl0dPgyiBT3XRA-Wfnw_P_0

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Learn
NODE_ENV=development`;
    
    require('fs').writeFileSync('.env', envContent);
    console.log('Updated .env file with new credentials');
    
    return project;
    
  } catch (error) {
    console.error('Error creating project:', error.message);
    throw error;
  }
}

async function waitForProject(projectId, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const project = await httpsRequest({
        hostname: SUPABASE_API_URL,
        path: `/v1/projects/${projectId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (project.status === 'ACTIVE_HEALTHY') {
        console.log('Project is ready!');
        return;
      }
    } catch (error) {
      // Project might not be ready yet
    }
    
    console.log(`Waiting... (${i + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error('Project did not become ready in time');
}

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 24; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Run the script
createProject().catch(console.error);