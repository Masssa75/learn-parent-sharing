const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ensureUserProfiles() {
  console.log('Ensuring all users have profile records...\n');
  
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, telegram_username, first_name');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log(`Found ${users.length} users`);
    
    // Check each user has a profile
    for (const user of users) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log(`Creating profile for ${user.telegram_username || user.first_name}...`);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            points: 0,
            total_xp: 0,
            level: 1
          });
        
        if (insertError) {
          console.error(`  ❌ Error creating profile:`, insertError);
        } else {
          console.log(`  ✅ Profile created`);
        }
      } else if (profile) {
        console.log(`✅ ${user.telegram_username || user.first_name} already has a profile`);
      }
    }
    
    console.log('\nDone! All users now have profiles.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

ensureUserProfiles();