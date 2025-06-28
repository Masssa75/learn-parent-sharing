const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'undefined') {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSchema() {
  console.log('Executing database schema...');
  console.log(`URL: ${supabaseUrl}`);
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements
    // More robust splitting that handles functions and complex statements
    const statements = [];
    let currentStatement = '';
    let inFunction = false;
    
    const lines = schema.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        continue;
      }
      
      // Check for function start/end
      if (trimmedLine.toUpperCase().includes('CREATE OR REPLACE FUNCTION') || 
          trimmedLine.toUpperCase().includes('CREATE FUNCTION')) {
        inFunction = true;
      }
      
      currentStatement += line + '\n';
      
      // Check for statement end
      if (!inFunction && trimmedLine.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      } else if (inFunction && trimmedLine === '$$ LANGUAGE plpgsql;') {
        statements.push(currentStatement.trim());
        currentStatement = '';
        inFunction = false;
      }
    }
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...';
      
      console.log(`\nExecuting ${i + 1}/${statements.length}: ${preview}`);
      
      try {
        // Use raw SQL execution through the REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ query: statement })
        });
        
        if (!response.ok) {
          // Try alternative approach - direct SQL through admin endpoint
          const { error } = await supabase.from('_sql').select(statement);
          
          if (error) {
            console.error(`❌ Error: ${error.message}`);
            errorCount++;
          } else {
            console.log('✓ Success');
            successCount++;
          }
        } else {
          console.log('✓ Success');
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n=== Schema Execution Summary ===');
    console.log(`Total statements: ${statements.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\nNote: Some statements failed. This might be expected if:');
      console.log('- Tables/functions already exist');
      console.log('- Using Supabase-specific functions');
      console.log('\nYou can manually execute the schema at:');
      console.log(`https://supabase.com/dashboard/project/${process.env.SUPABASE_PROJECT_ID}/sql/new`);
    }
    
    return { successCount, errorCount, total: statements.length };
    
  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  }
}

// Run the schema execution
executeSchema().catch(console.error);