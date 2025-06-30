const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllLikes() {
  try {
    // 1. Get ALL likes in the database
    console.log('1. Fetching ALL likes from database...');
    const { data: allLikes, error: likesError } = await supabase
      .from('likes')
      .select('user_id, post_id, created_at')
      .order('created_at', { ascending: false });
    
    if (likesError) {
      console.error('Error:', likesError);
      return;
    }
    
    console.log(`   Total likes in database: ${allLikes?.length || 0}`);
    
    // 2. Get user info
    const { data: users } = await supabase
      .from('users')
      .select('id, telegram_username')
      .in('id', [...new Set(allLikes?.map(l => l.user_id) || [])]);
    
    const userMap = new Map(users?.map(u => [u.id, u.telegram_username]) || []);
    
    // 3. Get post info
    const { data: posts } = await supabase
      .from('posts')
      .select('id, title')
      .in('id', [...new Set(allLikes?.map(l => l.post_id) || [])]);
    
    const postMap = new Map(posts?.map(p => [p.id, p.title]) || []);
    
    // 4. Display likes with details
    console.log('\n2. Like details:');
    allLikes?.forEach((like, i) => {
      const username = userMap.get(like.user_id) || 'Unknown';
      const postTitle = postMap.get(like.post_id) || 'Unknown';
      console.log(`   ${i+1}. User: ${username} (${like.user_id})`);
      console.log(`      Post: "${postTitle?.substring(0, 40)}..."`);
      console.log(`      Created: ${new Date(like.created_at).toLocaleString()}`);
      console.log('');
    });
    
    // 5. Check specifically for devtest user
    const devtestId = 'cdad4b8b-0355-414b-90ef-9769a1045b80';
    const devtestLikes = allLikes?.filter(l => l.user_id === devtestId) || [];
    console.log(`3. Devtest user (${devtestId}) has ${devtestLikes.length} likes`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllLikes();