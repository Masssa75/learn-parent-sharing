const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserLikes() {
  try {
    // 1. Get devtest user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, telegram_username')
      .eq('telegram_id', 999999999)
      .single();
    
    if (userError) throw userError;
    console.log('1. User found:', user);
    
    // 2. Get all likes for this user
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('post_id, created_at')
      .eq('user_id', user.id);
    
    if (likesError) throw likesError;
    console.log(`\n2. User has ${likes?.length || 0} likes`);
    
    // 3. Get all posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (postsError) throw postsError;
    
    // 4. Check which posts are liked
    const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
    
    console.log('\n3. Post like status:');
    posts?.forEach((post, i) => {
      const isLiked = likedPostIds.has(post.id);
      console.log(`   ${i + 1}. "${post.title.substring(0, 40)}..." - ${isLiked ? '❤️ LIKED' : '🤍 NOT LIKED'}`);
    });
    
    // 5. Remove one like to test
    if (likes && likes.length > 0) {
      const likeToRemove = likes[0];
      const postToUnlike = posts?.find(p => p.id === likeToRemove.post_id);
      
      console.log(`\n4. Removing like from post: "${postToUnlike?.title || 'Unknown'}"`);
      
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', likeToRemove.post_id);
      
      if (deleteError) {
        console.error('Error removing like:', deleteError);
      } else {
        console.log('✓ Like removed successfully');
        
        // Also decrease the likes_count on the post
        const { data: currentPost } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', likeToRemove.post_id)
          .single();
        
        if (currentPost && currentPost.likes_count > 0) {
          await supabase
            .from('posts')
            .update({ likes_count: currentPost.likes_count - 1 })
            .eq('id', likeToRemove.post_id);
          
          console.log('✓ Post likes_count decreased');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserLikes();