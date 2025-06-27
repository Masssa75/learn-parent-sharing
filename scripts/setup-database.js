const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
  }
  
  // Read the schema file
  const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Split schema into individual statements
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements to execute`);
  
  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
    console.log(statement.substring(0, 80) + '...');
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ query: statement })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`Error: ${error}`);
      } else {
        console.log('✓ Success');
      }
    } catch (error) {
      console.error(`Failed: ${error.message}`);
    }
  }
  
  console.log('\nDatabase setup complete!');
}

// Load environment variables
require('dotenv').config();

setupDatabase().catch(console.error);