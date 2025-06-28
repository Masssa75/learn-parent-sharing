const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_ACCESS_TOKEN = 'sbp_6f04b779bfc9e9fb52600595aabdfb3545a84add';
const PROJECT_ID = 'yvzinotrjggncbwflxok';
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

async function getProjectKeys() {
  console.log('Getting API keys...');
  
  try {
    const keys = await httpsRequest({
      hostname: SUPABASE_API_URL,
      path: `/v1/projects/${PROJECT_ID}/api-keys`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Find the anon and service_role keys
    const anonKey = keys.find(k => k.name === 'anon')?.api_key;
    const serviceKey = keys.find(k => k.name === 'service_role')?.api_key;
    
    if (!anonKey || !serviceKey) {
      throw new Error('Could not find required API keys');
    }
    
    return { anonKey, serviceKey };
  } catch (error) {
    console.error('Error getting keys:', error);
    throw error;
  }
}

async function executeSchema() {
  console.log('Setting up Supabase database for Learn Parent Sharing...');
  
  try {
    // First get the API keys
    const { anonKey, serviceKey } = await getProjectKeys();
    
    console.log('✓ Retrieved API keys');
    
    // Update .env file with correct keys
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/g, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`);
    envContent = envContent.replace(/SUPABASE_SERVICE_ROLE_KEY=.*/g, `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`);
    
    fs.writeFileSync(envPath, envContent);
    console.log('✓ Updated .env file with API keys');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('\nExecuting database schema...');
    console.log('Note: The schema needs to be executed via Supabase Dashboard');
    console.log('\nTo complete setup:');
    console.log(`1. Go to: https://supabase.com/dashboard/project/${PROJECT_ID}/sql/new`);
    console.log('2. Copy and paste the contents of supabase/schema.sql');
    console.log('3. Click "Run" to execute the schema');
    
    // Save credentials for reference
    const credsPath = path.join(__dirname, '..', 'SUPABASE_CREDENTIALS.txt');
    const credentials = `
Learn Parent Sharing - Supabase Credentials
==========================================

Project URL: https://${PROJECT_ID}.supabase.co
Project ID: ${PROJECT_ID}

Anon Key: ${anonKey}
Service Role Key: ${serviceKey}

Dashboard URL: https://supabase.com/dashboard/project/${PROJECT_ID}
SQL Editor: https://supabase.com/dashboard/project/${PROJECT_ID}/sql/new

Next Steps:
1. Go to the SQL Editor URL above
2. Copy the contents of supabase/schema.sql
3. Paste and run in the SQL editor
`;
    
    fs.writeFileSync(credsPath, credentials);
    console.log(`\n✓ Credentials saved to: SUPABASE_CREDENTIALS.txt`);
    
    return { anonKey, serviceKey, projectId: PROJECT_ID };
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run the setup
executeSchema().catch(console.error);