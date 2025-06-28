const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Using service role key to bypass RLS for production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

console.log('🚀 Creating test users in PRODUCTION database...');
console.log(`Database: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createProductionTestUsers() {
  // Test users data
  const testUsers = [
    {
      telegram_id: 999999999,
      telegram_username: 'devtest',
      first_name: 'Dev',
      last_name: 'Test',
      photo_url: null
    },
    {
      telegram_id: 888888888,
      telegram_username: 'admintest',
      first_name: 'Admin',
      last_name: 'Test',
      photo_url: null
    }
  ];

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, telegram_username')
        .eq('telegram_id', userData.telegram_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        console.error(`❌ Error checking for user ${userData.telegram_username}:`, fetchError.message);
        continue;
      }

      if (existingUser) {
        console.log(`✓ User already exists: ${existingUser.telegram_username} (ID: ${existingUser.id})`);
        
        // Update to ensure data is current
        const { error: updateError } = await supabase
          .from('users')
          .update({
            telegram_username: userData.telegram_username,
            first_name: userData.first_name,
            last_name: userData.last_name
          })
          .eq('telegram_id', userData.telegram_id);
          
        if (updateError) {
          console.error(`  ❌ Failed to update: ${updateError.message}`);
        } else {
          console.log(`  ✓ Updated user data`);
        }
      } else {
        // Create new user
        console.log(`Creating user: ${userData.telegram_username}...`);
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single();

        if (createError) {
          console.error(`❌ Failed to create ${userData.telegram_username}: ${createError.message}`);
          console.error('Details:', createError);
        } else {
          console.log(`✅ Created user: ${newUser.telegram_username} (ID: ${newUser.id})`);
        }
      }
    } catch (error) {
      console.error(`❌ Unexpected error for ${userData.telegram_username}:`, error.message);
    }
  }

  // Verify users were created
  console.log('\n📋 Verifying test users...');
  const { data: allUsers, error: verifyError } = await supabase
    .from('users')
    .select('id, telegram_id, telegram_username, first_name, last_name')
    .in('telegram_id', [999999999, 888888888]);

  if (verifyError) {
    console.error('❌ Failed to verify users:', verifyError.message);
  } else {
    console.log('\nTest users in database:');
    allUsers.forEach(user => {
      console.log(`- ${user.telegram_username} (ID: ${user.id}, Telegram ID: ${user.telegram_id})`);
    });
  }

  console.log('\n✅ Production test user setup complete!');
  console.log('\nYou should now be able to login at:');
  console.log('https://learn-parent-sharing-app.netlify.app/test-auth');
  console.log('Password: test-learn-2025 (or your custom DEV_LOGIN_PASSWORD)');
}

// Run the script
createProductionTestUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });