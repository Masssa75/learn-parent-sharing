const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateDevtestToAdmin() {
  console.log('🚀 Making devtest user an admin for testing...');
  
  try {
    // Update devtest to be admin
    const { data, error } = await supabase
      .from('users')
      .update({ is_admin: true })
      .eq('telegram_id', 999999999)
      .select()
      .single();
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('✅ Updated devtest to admin!');
      console.log('User:', data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateDevtestToAdmin();