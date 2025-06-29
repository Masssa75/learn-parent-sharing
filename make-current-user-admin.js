const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeYourUserAdmin() {
  console.log('🔍 Finding your user account and making it admin...');
  
  try {
    // First, let's find all users to identify which one is yours
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log('\n📊 All users in the database:');
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.first_name} ${user.last_name || ''}`);
      console.log(`   Telegram ID: ${user.telegram_id}`);
      console.log(`   Username: @${user.telegram_username || 'N/A'}`);
      console.log(`   Is Admin: ${user.is_admin ? '✅ Yes' : '❌ No'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
    });
    
    // Find non-admin users that might be you (excluding test accounts)
    const realUsers = users.filter(u => 
      u.telegram_id !== 999999999 && // devtest
      u.telegram_id !== 888888888 && // admintest  
      u.telegram_id !== 777777777    // admindev
    );
    
    if (realUsers.length > 0) {
      console.log('\n🎯 Found real user accounts (not test accounts):');
      
      for (const user of realUsers) {
        if (!user.is_admin) {
          console.log(`\n📝 Making ${user.first_name} ${user.last_name || ''} (@${user.telegram_username}) an admin...`);
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ is_admin: true })
            .eq('id', user.id);
          
          if (updateError) {
            console.error('Error updating:', updateError);
          } else {
            console.log('✅ Successfully made admin!');
            console.log('\n🎉 Next steps:');
            console.log('1. Refresh the page (or logout and login again)');
            console.log('2. Click your profile button');
            console.log('3. You should now see "Admin Dashboard" in the menu!');
          }
        } else {
          console.log(`\n✅ ${user.first_name} is already an admin!`);
        }
      }
    } else {
      console.log('\n⚠️  No real user accounts found (only test accounts).');
      console.log('Please login with your Telegram account first.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

makeYourUserAdmin();