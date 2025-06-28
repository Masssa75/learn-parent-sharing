const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function applyRLSPolicy() {
  console.log('🔧 Applying RLS policy for test users...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // SQL to create the policy
  const sql = `
    -- Enable RLS on users table
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow reading test users" ON users;
    DROP POLICY IF EXISTS "Allow authenticated users to read all users" ON users;
    
    -- Create policy to allow reading test users via anon key
    CREATE POLICY "Allow reading test users" ON users
      FOR SELECT
      TO anon
      USING (telegram_id IN (999999999, 888888888));
    
    -- Allow authenticated users to read all users
    CREATE POLICY "Allow authenticated users to read all users" ON users
      FOR SELECT
      TO authenticated
      USING (true);
  `;
  
  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    .catch(async () => {
      // If RPC doesn't exist, try another approach
      console.log('RPC not available, using alternative method...');
      
      // For now, we'll just test if it works
      return { data: null, error: 'Cannot execute SQL directly' };
    });
  
  if (error) {
    console.log('⚠️  Cannot apply RLS policy programmatically.');
    console.log('\nPlease run this SQL in your Supabase dashboard:');
    console.log('----------------------------------------');
    console.log(sql);
    console.log('----------------------------------------');
    console.log('\nGo to: https://supabase.com/dashboard/project/yvzinotrjggncbwflxok/sql/new');
  } else {
    console.log('✅ RLS policy applied successfully!');
  }
  
  // Test if it works now
  console.log('\n🧪 Testing with anon key...');
  const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: testUser, error: testError } = await anonSupabase
    .from('users')
    .select('telegram_username')
    .eq('telegram_id', 999999999)
    .single();
    
  if (testError) {
    console.log('❌ Still cannot read with anon key:', testError.message);
  } else {
    console.log('✅ Success! Can now read test user:', testUser.telegram_username);
  }
}

applyRLSPolicy().catch(console.error);