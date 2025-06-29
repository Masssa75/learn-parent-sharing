const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserPhoto() {
  try {
    // Look for Marc's user data
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .or('first_name.eq.Marc,telegram_username.eq.cyrator007')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    console.log(`Found ${users.length} user(s) matching "Marc":\n`);

    for (const user of users) {
      console.log('User Details:');
      console.log('- ID:', user.id);
      console.log('- Telegram ID:', user.telegram_id);
      console.log('- Username:', user.telegram_username);
      console.log('- First Name:', user.first_name);
      console.log('- Last Name:', user.last_name);
      console.log('- Photo URL:', user.photo_url || '❌ NO PHOTO URL');
      console.log('- Is Admin:', user.is_admin);
      console.log('- Created:', new Date(user.created_at).toLocaleString());
      console.log('- Updated:', new Date(user.updated_at).toLocaleString());
      console.log('\n' + '='.repeat(50) + '\n');
    }

    // Also check what the auth/check endpoint would return
    if (users.length > 0) {
      const user = users[0];
      console.log('What auth/check would return:');
      console.log({
        id: user.id,
        telegramId: user.telegram_id,
        username: user.telegram_username,
        firstName: user.first_name,
        lastName: user.last_name,
        photoUrl: user.photo_url,
        displayName: user.first_name + (user.last_name ? ` ${user.last_name}` : ''),
        isAdmin: user.is_admin || false
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserPhoto();