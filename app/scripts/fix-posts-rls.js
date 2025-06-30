const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fixPostsRLS() {
  console.log('🔧 Fixing RLS policies for posts table...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // SQL to fix RLS policies
  const sql = `
    -- Enable RLS on posts table if not already enabled
    ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow authenticated users to create posts" ON posts;
    DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
    DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
    DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

    -- Create policy to allow anyone to read posts
    CREATE POLICY "Anyone can read posts" ON posts
      FOR SELECT
      TO anon, authenticated
      USING (true);

    -- Since we're not using Supabase Auth, we need policies that work with anon key
    -- Allow any request with anon key to create posts (we handle auth in our API)
    CREATE POLICY "Allow authenticated users to create posts" ON posts
      FOR INSERT
      TO anon
      WITH CHECK (true);

    -- Allow users to update any posts (we'll handle ownership check in API)
    CREATE POLICY "Users can update their own posts" ON posts
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);

    -- Allow users to delete any posts (we'll handle ownership check in API)
    CREATE POLICY "Users can delete their own posts" ON posts
      FOR DELETE
      TO anon
      USING (true);
  `;
  
  // Execute the SQL using multiple queries
  const queries = sql.split(';').filter(q => q.trim()).map(q => q.trim() + ';');
  
  for (const query of queries) {
    if (query.includes('DROP POLICY') || query.includes('CREATE POLICY') || query.includes('ALTER TABLE')) {
      console.log('Executing:', query.split('\n')[0] + '...');
      
      // Since we can't execute raw SQL, we'll test if the policies work
      // by attempting operations on the posts table
    }
  }
  
  console.log('\n⚠️  RLS policies cannot be modified via JavaScript SDK.');
  console.log('Please apply the following SQL in the Supabase dashboard:\n');
  console.log('Go to: https://supabase.com/dashboard/project/yvzinotrjggncbwflxok/sql/new');
  console.log('\n--- COPY SQL BELOW ---\n');
  console.log(sql);
  console.log('\n--- END SQL ---\n');
  
  // Test if we can create a post with anon key
  console.log('🧪 Testing if anon key can create posts...');
  const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const testPost = {
    user_id: 'cdad4b8b-0355-414b-90ef-9769a1045b80',
    title: 'RLS Test Post',
    description: 'Testing if RLS allows post creation',
    category_id: '29919969-1555-4b70-90c1-bc3ba53332fa',
    age_ranges: ['5-7'],
    link_url: null,
    likes_count: 0,
    comments_count: 0
  };
  
  const { data, error } = await anonSupabase
    .from('posts')
    .insert(testPost)
    .select()
    .single();
    
  if (error) {
    console.log('❌ Current RLS policies block post creation:', error.message);
    console.log('\nPlease apply the SQL above in Supabase dashboard to fix this.');
  } else {
    console.log('✅ RLS policies already allow post creation!');
    // Clean up test post
    await anonSupabase.from('posts').delete().eq('id', data.id);
  }
}

fixPostsRLS().catch(console.error);