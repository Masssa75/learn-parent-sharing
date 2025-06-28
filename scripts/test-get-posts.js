const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testGetPosts() {
  console.log('🧪 Testing posts fetch query...\n');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test the exact query from the API
  console.log('Running the exact query from /api/posts...');
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      users!posts_user_id_fkey (
        id,
        telegram_username,
        first_name,
        last_name,
        photo_url
      ),
      categories (
        id,
        name,
        emoji
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (error) {
    console.error('❌ Error fetching posts:', error.message);
    console.error('Error code:', error.code);
    console.error('Error hint:', error.hint);
    console.error('Full error:', JSON.stringify(error, null, 2));
  } else {
    console.log(`✅ Successfully fetched ${posts.length} posts\n`);
    
    if (posts.length > 0) {
      console.log('Sample post:');
      console.log(JSON.stringify(posts[0], null, 2));
    }
  }
  
  // Also test a simpler query
  console.log('\n🧪 Testing simpler query (just posts table)...');
  const { data: simplePosts, error: simpleError } = await supabase
    .from('posts')
    .select('*')
    .limit(5);
    
  if (simpleError) {
    console.error('❌ Simple query also failed:', simpleError.message);
  } else {
    console.log(`✅ Simple query worked! Found ${simplePosts.length} posts`);
  }
}

testGetPosts().catch(console.error);