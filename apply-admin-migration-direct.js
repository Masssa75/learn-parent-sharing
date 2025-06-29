const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://yvzinotrjggncbwflxok.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2emlub3RyamdnbmNid2ZseG9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAyMTc1NiwiZXhwIjoyMDY2NTk3NzU2fQ.omdMqkrZWZYyd09J4C7onLqonaKY1OhTiGBhbAR_mEk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyAdminMigration() {
  console.log('🚀 Applying admin migration...');
  
  try {
    // First check if is_admin column already exists
    const { data: users, error: checkError } = await supabase
      .from('users')
      .select('id, telegram_id, is_admin')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Admin column already exists!');
      return;
    }
    
    if (checkError.message.includes('column "is_admin" does not exist')) {
      console.log('📝 Admin column not found. Creating it now...');
      
      // Read the migration file
      const migrationPath = path.join(__dirname, 'supabase/migrations/20250629000000_add_admin_system.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
      
      // Split into individual statements
      const statements = migrationSQL
        .split(/;\s*$/m)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      console.log(`\n📊 Migration contains ${statements.length} SQL statements`);
      console.log('\n⚠️  Manual execution required!');
      console.log('\nPlease execute the following in Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/yvzinotrjggncbwflxok/sql/new\n');
      console.log('=== COPY EVERYTHING BELOW THIS LINE ===\n');
      console.log(migrationSQL);
      console.log('\n=== END OF SQL ===');
      
      console.log('\n📋 Quick Summary of what this migration does:');
      console.log('1. Adds is_admin column to users table');
      console.log('2. Creates admin_users tracking table');
      console.log('3. Sets up RLS policies for admin access');
      console.log('4. Creates helper functions for admin management');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyAdminMigration();