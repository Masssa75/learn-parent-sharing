const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminDevUser() {
  console.log('🚀 Creating admin dev user...');
  
  try {
    // First, let's check if the admin column exists by trying to create a user with it
    const adminUser = {
      telegram_id: 777777777,
      telegram_username: 'admindev',
      first_name: 'Admin',
      last_name: 'Developer',
      photo_url: null,
      is_admin: true  // This will fail if column doesn't exist
    };
    
    // Try to create the admin user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert(adminUser)
      .select()
      .single();
    
    if (createError) {
      if (createError.message.includes('column "is_admin" does not exist')) {
        console.log('❌ Admin column does not exist yet.');
        console.log('\n📝 Creating admin user without is_admin flag first...');
        
        // Create without is_admin
        delete adminUser.is_admin;
        const { data: basicUser, error: basicError } = await supabase
          .from('users')
          .insert(adminUser)
          .select()
          .single();
        
        if (basicError) {
          if (basicError.code === '23505') {
            console.log('✅ Admin dev user already exists!');
            
            // Get the existing user
            const { data: existingUser } = await supabase
              .from('users')
              .select('*')
              .eq('telegram_id', 777777777)
              .single();
            
            console.log('\n📊 User Details:');
            console.log(`ID: ${existingUser.id}`);
            console.log(`Username: @${existingUser.telegram_username}`);
            console.log(`Name: ${existingUser.first_name} ${existingUser.last_name}`);
            console.log(`Admin Status: ${existingUser.is_admin || 'Column not available'}`);
          } else {
            throw basicError;
          }
        } else {
          console.log('✅ Created basic user:', basicUser.id);
          console.log('\n⚠️  Note: User created but NOT an admin yet.');
          console.log('Apply the admin migration first, then run setup-admin script.');
        }
      } else if (createError.code === '23505') {
        console.log('✅ Admin dev user already exists!');
        
        // Update to make admin
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ is_admin: true })
          .eq('telegram_id', 777777777)
          .select()
          .single();
        
        if (updateError) {
          console.log('Could not update admin status:', updateError.message);
        } else {
          console.log('✅ Updated user to admin:', updatedUser.id);
        }
      } else {
        throw createError;
      }
    } else {
      console.log('✅ Admin dev user created successfully!');
      console.log('\n📊 User Details:');
      console.log(`ID: ${newUser.id}`);
      console.log(`Username: @${newUser.telegram_username}`);
      console.log(`Name: ${newUser.first_name} ${newUser.last_name}`);
      console.log(`Admin: ${newUser.is_admin}`);
      
      // Create profile
      await supabase
        .from('profiles')
        .insert({
          user_id: newUser.id,
          bio: 'Admin developer account',
          kids_ages: [],
          interests: []
        });
    }
    
    console.log('\n🔐 Login Instructions:');
    console.log('1. Go to: https://learn-parent-sharing-app.netlify.app/test-auth');
    console.log('2. Enter password from DEV_LOGIN_PASSWORD in .env');
    console.log('3. Click "Login as admindev"');
    console.log('4. Access admin panel at: /admin');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createAdminDevUser();