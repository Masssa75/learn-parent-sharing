const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugUsersTable() {
  console.log('🔍 Debugging users table...\n');

  // Skip RPC call - not needed

  // 2. Try to fetch test user by telegram_id
  console.log('\n2. Fetching test user by telegram_id = 999999999...');
  const { data: user1, error: error1 } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', 999999999)
    .single();

  if (error1) {
    console.log('Error:', error1.message);
  } else {
    console.log('Found user:');
    console.log(JSON.stringify(user1, null, 2));
  }

  // 3. List all users (first 5)
  console.log('\n3. Listing first 5 users...');
  const { data: allUsers, error: allError } = await supabase
    .from('users')
    .select('*')
    .limit(5);

  if (allError) {
    console.log('Error:', allError.message);
  } else {
    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach((user, i) => {
      console.log(`\nUser ${i + 1}:`);
      Object.keys(user).forEach(key => {
        if (user[key] !== null) {
          console.log(`  ${key}: ${user[key]}`);
        }
      });
    });
  }

  // 4. Check what columns exist
  console.log('\n4. Checking actual columns from first user...');
  if (allUsers && allUsers.length > 0) {
    const columns = Object.keys(allUsers[0]);
    console.log('Columns:', columns);
    
    const hasUsername = columns.includes('username');
    const hasTelegramUsername = columns.includes('telegram_username');
    
    console.log(`\n- Has 'username' column: ${hasUsername}`);
    console.log(`- Has 'telegram_username' column: ${hasTelegramUsername}`);
  }
}

debugUsersTable().catch(console.error);