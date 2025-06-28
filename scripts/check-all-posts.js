const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkAllPosts() {
  console.log('🔍 Checking all posts in database...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get all posts
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Error fetching posts:', error.message);
    return;
  }
  
  console.log(`Found ${posts.length} posts in total\n`);
  
  if (posts.length > 0) {
    posts.forEach((post, index) => {
      console.log(`Post ${index + 1}:`);
      console.log(`  ID: ${post.id}`);
      console.log(`  Title: ${post.title}`);
      console.log(`  Created: ${new Date(post.created_at).toLocaleString()}`);
      console.log(`  User ID: ${post.user_id}`);
      console.log(`  Category ID: ${post.category_id}`);
      console.log('---');
    });
  } else {
    console.log('No posts found in the database');
  }
}

checkAllPosts().catch(console.error);