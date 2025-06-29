const fs = require('fs');
const path = require('path');

async function executeMigration() {
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, 'supabase/migrations/20250629000000_add_admin_system.sql'),
    'utf-8'
  );

  const supabaseUrl = 'https://yvzinotrjggncbwflxok.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2emlub3RyamdnbmNid2ZseG9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAyMTc1NiwiZXhwIjoyMDY2NTk3NzU2fQ.omdMqkrZWZYyd09J4C7onLqonaKY1OhTiGBhbAR_mEk';

  // Split SQL into individual statements
  const statements = migrationSQL
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Executing ${statements.length} SQL statements...`);

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      console.log(`\nExecuting: ${statement.substring(0, 50)}...`);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: statement + ';'
        })
      });

      if (response.ok) {
        console.log('✅ Success');
        successCount++;
      } else {
        const error = await response.text();
        console.log('❌ Failed:', error);
        errorCount++;
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} successful, ${errorCount} failed`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some statements failed. Trying alternative approach...');
    
    // Try using Supabase JS client for database functions
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Test if admin column exists
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .limit(1);
    
    if (error && error.message.includes('column "is_admin" does not exist')) {
      console.log('\n🔧 Admin column not found. Please execute the migration manually in Supabase dashboard.');
      console.log('Go to: https://supabase.com/dashboard/project/yvzinotrjggncbwflxok/sql/new');
      console.log('Copy and paste the migration SQL from: app/supabase/migrations/20250629000000_add_admin_system.sql');
    } else if (!error) {
      console.log('\n✅ Admin column already exists! Migration may have been partially applied.');
    }
  }
}

executeMigration().catch(console.error);