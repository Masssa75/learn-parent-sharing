const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkPostsTable() {
  console.log('🔍 Checking posts table structure...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Try to get table info via a query
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('❌ Error accessing posts table:', error.message);
    console.error('Hint:', error.hint);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('✅ Posts table exists and is accessible');
    console.log('\nSample row structure:');
    console.log(Object.keys(data[0]));
  } else {
    console.log('✅ Posts table exists but is empty');
  }
  
  // Check if we can insert a test post
  console.log('\n🧪 Testing post creation...');
  
  const testPost = {
    user_id: 'cdad4b8b-0355-414b-90ef-9769a1045b80', // devtest user ID
    title: 'Test Post from Script',
    description: 'This is a test post created by the check script',
    category_id: '29919969-1555-4b70-90c1-bc3ba53332fa', // Apps & Software
    age_ranges: ['5-7'],
    link_url: 'https://example.com',
    likes_count: 0,
    comments_count: 0
  };
  
  console.log('Attempting to create post with:', testPost);
  
  const { data: newPost, error: insertError } = await supabase
    .from('posts')
    .insert(testPost)
    .select()
    .single();
    
  if (insertError) {
    console.error('\n❌ Failed to create post:', insertError.message);
    console.error('Details:', insertError.details);
    console.error('Hint:', insertError.hint);
  } else {
    console.log('\n✅ Successfully created test post!');
    console.log('Post ID:', newPost.id);
    
    // Delete the test post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', newPost.id);
      
    if (deleteError) {
      console.error('⚠️  Could not delete test post:', deleteError.message);
    } else {
      console.log('🧹 Test post deleted');
    }
  }
}

checkPostsTable().catch(console.error);