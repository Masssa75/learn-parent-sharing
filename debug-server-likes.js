const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugLikes() {
  try {
    // 1. Check what likes exist for devtest user
    const userId = 'cdad4b8b-0355-414b-90ef-9769a1045b80';
    
    console.log('1. Fetching likes for user:', userId);
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('post_id, created_at')
      .eq('user_id', userId);
    
    if (likesError) {
      console.error('Error fetching likes:', likesError);
    } else {
      console.log(`   Found ${likes?.length || 0} likes`);
      if (likes && likes.length > 0) {
        console.log('   Liked post IDs:', likes.map(l => l.post_id));
      }
    }
    
    // 2. Get posts to see their IDs
    console.log('\n2. Fetching posts...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title')
      .order('created_at', { ascending: false })
      .limit(4);
    
    if (postsError) {
      console.error('Error fetching posts:', postsError);
    } else {
      console.log('   Posts:');
      posts?.forEach((post, i) => {
        console.log(`   ${i+1}. ${post.id} - "${post.title.substring(0, 40)}..."`);
      });
    }
    
    // 3. Check if likes match posts
    if (likes && posts) {
      const likedPostIds = new Set(likes.map(l => l.post_id));
      console.log('\n3. Matching likes to posts:');
      posts.forEach(post => {
        const isLiked = likedPostIds.has(post.id);
        console.log(`   ${post.title.substring(0, 40)}... - ${isLiked ? '❤️ LIKED' : '🤍 NOT LIKED'}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugLikes();