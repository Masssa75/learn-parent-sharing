const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test with both keys
async function testWithKey(keyType, key) {
  console.log(`\n📋 Testing with ${keyType} key...`);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabase = createClient(supabaseUrl, key);
  
  // Try to fetch test user
  const { data, error } = await supabase
    .from('users')
    .select('id, telegram_id, telegram_username')
    .eq('telegram_id', 999999999)
    .single();
    
  if (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    console.log(`   Details: ${error.details}`);
  } else {
    console.log(`✅ Success! Found user: ${data.telegram_username}`);
  }
}

async function checkRLS() {
  console.log('🔍 Checking RLS policies on users table...\n');
  
  // Test with anon key (what the deployed app uses)
  await testWithKey('ANON', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // Test with service key (bypasses RLS)
  await testWithKey('SERVICE', process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('\n💡 If ANON key fails but SERVICE key works, it means:');
  console.log('   - RLS is enabled on the users table');
  console.log('   - There\'s no policy allowing anonymous reads');
  console.log('   - We need to add a policy or disable RLS');
}

checkRLS().catch(console.error);