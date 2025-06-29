const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDevtestProfile() {
  console.log('Checking devtest user profile...\n');
  
  try {
    // Get devtest user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', 999999999)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }
    
    console.log('User found:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: ${user.telegram_username}`);
    console.log(`  Name: ${user.first_name} ${user.last_name || ''}`);
    
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError) {
      console.error('\n❌ Profile error:', profileError);
      
      if (profileError.code === 'PGRST116') {
        console.log('\nCreating profile for devtest...');
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            points: 0,
            total_xp: 0,
            level: 1
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Failed to create profile:', insertError);
        } else {
          console.log('✅ Profile created successfully:', newProfile);
        }
      }
    } else {
      console.log('\nProfile found:');
      console.log(`  Points: ${profile.points}`);
      console.log(`  Total XP: ${profile.total_xp}`);
      console.log(`  Level: ${profile.level}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDevtestProfile();