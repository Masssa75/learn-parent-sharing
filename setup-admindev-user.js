const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdminDevUser() {
  console.log('🚀 Setting up admindev user...');
  
  try {
    // First check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', 777777777)
      .single();
    
    if (existingUser) {
      console.log('✅ User already exists!');
      console.log('Current admin status:', existingUser.is_admin);
      
      if (!existingUser.is_admin) {
        // Update to admin
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_admin: true })
          .eq('telegram_id', 777777777);
        
        if (updateError) {
          console.error('Error updating admin status:', updateError);
        } else {
          console.log('✅ Updated user to admin!');
        }
      }
      
      // Create profile if missing
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', existingUser.id)
        .single();
      
      if (!profile) {
        await supabase
          .from('profiles')
          .insert({
            user_id: existingUser.id,
            bio: 'Admin developer account',
            kids_ages: [],
            interests: []
          });
        console.log('✅ Created profile');
      }
    } else {
      // Create new admin user
      console.log('Creating new admindev user...');
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          telegram_id: 777777777,
          telegram_username: 'admindev',
          first_name: 'Admin',
          last_name: 'Developer',
          photo_url: null,
          is_admin: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user:', createError);
        return;
      }
      
      console.log('✅ Created admin user:', newUser.id);
      
      // Create profile
      await supabase
        .from('profiles')
        .insert({
          user_id: newUser.id,
          bio: 'Admin developer account',
          kids_ages: [],
          interests: []
        });
      
      console.log('✅ Created profile');
    }
    
    console.log('\n🔐 Login Instructions:');
    console.log('1. Go to: https://learn-parent-sharing-app.netlify.app/test-auth');
    console.log('2. Enter password: test-learn-2025');
    console.log('3. Click "Login as admindev"');
    console.log('4. You will see "Admin Dashboard" in the user menu');
    console.log('5. Access admin panel at: /admin');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

setupAdminDevUser();