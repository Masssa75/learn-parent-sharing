const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Using service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log('🚀 Creating test users...\n');

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
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, telegram_username')
        .eq('telegram_id', userData.telegram_id)
        .single();

      if (existingUser) {
        console.log(`✓ User already exists: ${existingUser.telegram_username || 'unnamed'} (ID: ${existingUser.id})`);
        
        // Update user data to ensure it's current
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
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single();

        if (createError) {
          console.error(`❌ Failed to create ${userData.telegram_username}: ${createError.message}`);
        } else {
          console.log(`✅ Created user: ${newUser.telegram_username} (ID: ${newUser.id})`);
          
          // Create profile for new user
          const isAdmin = userData.telegram_id === 888888888;
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: newUser.id,
              bio: isAdmin ? 'Admin test user for development' : 'Test user for development',
              location: isAdmin ? 'Admin Location' : 'Test Location',
              is_admin: isAdmin
            });
            
          if (profileError && profileError.code !== '23505') { // Ignore duplicate key errors
            console.error(`  ⚠️  Failed to create profile: ${profileError.message}`);
          } else {
            console.log(`  ✓ Created profile (admin: ${isAdmin})`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${userData.telegram_username}:`, error.message);
    }
  }

  console.log('\n✅ Test user setup complete!');
  console.log('\nYou can now login with these test users at:');
  console.log('https://learn-parent-sharing-app.netlify.app/test-auth');
  console.log('\nMake sure ALLOW_DEV_LOGIN=true is set in Netlify environment variables.');
}

// Run the script
createTestUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });