const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_ACCESS_TOKEN = 'sbp_6f04b779bfc9e9fb52600595aabdfb3545a84add';
const PROJECT_ID = 'yvzinotrjggncbwflxok';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_ID}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Executing database schema via Supabase Management API...');
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const fullSchema = fs.readFileSync(schemaPath, 'utf8');
    
    // Try to execute the entire schema at once
    console.log('Attempting to execute full schema...');
    
    try {
      const result = await executeSQL(fullSchema);
      console.log('✅ Schema executed successfully!');
      console.log(result);
    } catch (error) {
      console.log('Full schema execution failed, trying statement by statement...');
      
      // Split into individual statements
      const statements = fullSchema
        .split(/;\s*$/m)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      console.log(`Found ${statements.length} statements to execute`);
      
      let success = 0, failed = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';';
        const preview = stmt.substring(0, 50).replace(/\n/g, ' ');
        console.log(`\n[${i+1}/${statements.length}] ${preview}...`);
        
        try {
          await executeSQL(stmt);
          console.log('✅ Success');
          success++;
        } catch (err) {
          console.log(`❌ Failed: ${err.message}`);
          failed++;
        }
      }
      
      console.log(`\nCompleted: ${success} successful, ${failed} failed`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();