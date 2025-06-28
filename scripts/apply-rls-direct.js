const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Parse the Supabase URL to get database connection details
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const url = new URL(SUPABASE_URL);
const projectRef = url.hostname.split('.')[0]; // yvzinotrjggncbwflxok

async function applyRLSPolicies() {
  console.log('🔧 Applying RLS policies for posts table...\n');
  
  // First, let's test with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Test current state
  console.log('📊 Testing current RLS state...');
  
  // Try to insert a post with anon key
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const testPost = {
    user_id: 'cdad4b8b-0355-414b-90ef-9769a1045b80',
    title: 'RLS Test',
    description: 'Testing RLS policies',
    category_id: '29919969-1555-4b70-90c1-bc3ba53332fa',
    age_ranges: ['5-7'],
    likes_count: 0,
    comments_count: 0
  };
  
  console.log('Testing INSERT with anon key...');
  const { data: insertData, error: insertError } = await anonSupabase
    .from('posts')
    .insert(testPost)
    .select()
    .single();
    
  if (insertError) {
    console.log('❌ Current RLS blocks INSERT:', insertError.message);
  } else {
    console.log('✅ INSERT already works with anon key!');
    // Clean up
    await supabase.from('posts').delete().eq('id', insertData.id);
  }
  
  // Test SELECT
  console.log('\nTesting SELECT with anon key...');
  const { data: selectData, error: selectError } = await anonSupabase
    .from('posts')
    .select('*')
    .limit(1);
    
  if (selectError) {
    console.log('❌ Current RLS blocks SELECT:', selectError.message);
  } else {
    console.log('✅ SELECT already works with anon key!');
  }
  
  // Provide SQL for manual execution
  console.log('\n📝 To fix RLS policies, run this SQL in Supabase dashboard:');
  console.log('Go to: https://supabase.com/dashboard/project/yvzinotrjggncbwflxok/sql/new\n');
  
  const sql = `
-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on posts
DROP POLICY IF EXISTS "Allow authenticated users to create posts" ON posts;
DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "public_read_posts" ON posts;
DROP POLICY IF EXISTS "api_insert_posts" ON posts;
DROP POLICY IF EXISTS "api_update_posts" ON posts;
DROP POLICY IF EXISTS "api_delete_posts" ON posts;

-- Create simple policies for our custom auth system
-- Allow anyone to read posts
CREATE POLICY "public_read_posts" ON posts
  FOR SELECT
  USING (true);

-- Allow all operations through our API (we handle auth in the API layer)
CREATE POLICY "api_insert_posts" ON posts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "api_update_posts" ON posts
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "api_delete_posts" ON posts
  FOR DELETE
  USING (true);
`;
  
  console.log('--- COPY SQL BELOW ---');
  console.log(sql);
  console.log('--- END SQL ---\n');
  
  // Also save to a file for easy access
  const fs = require('fs');
  fs.writeFileSync('rls-fix.sql', sql);
  console.log('💾 SQL also saved to: rls-fix.sql');
}

applyRLSPolicies().catch(console.error);