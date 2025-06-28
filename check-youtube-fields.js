require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkYouTubeFields() {
  console.log('Checking posts with YouTube links...\n');
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .like('title', '%TV Series%')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  posts.forEach(post => {
    console.log('Post:', post.title);
    console.log('  ID:', post.id);
    console.log('  link_url:', post.link_url);
    console.log('  youtube_video_id:', post.youtube_video_id);
    console.log('  All fields:', Object.keys(post).join(', '));
    console.log('---');
  });
}

checkYouTubeFields();