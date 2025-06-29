require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdminTest() {
  try {
    console.log('Checking admintest user (telegram_id: 888888888)...\n');
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', 888888888)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return;
    }
    
    if (!user) {
      console.log('❌ admintest user not found!');
      return;
    }
    
    console.log('User found:');
    console.log('- ID:', user.id);
    console.log('- Username:', user.telegram_username);
    console.log('- Name:', user.first_name, user.last_name);
    console.log('- Is Admin:', user.is_admin ? '✅ YES' : '❌ NO');
    console.log('- Created:', new Date(user.created_at).toLocaleString());
    
    if (!user.is_admin) {
      console.log('\n⚠️  admintest user is NOT an admin!');
      console.log('Making admintest an admin...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('telegram_id', 888888888);
      
      if (updateError) {
        console.error('Error updating user:', updateError);
      } else {
        console.log('✅ Successfully made admintest an admin!');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdminTest();