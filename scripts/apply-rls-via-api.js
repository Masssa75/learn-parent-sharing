const fetch = require('node-fetch');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function applyRLSPolicies() {
  console.log('🔧 Applying RLS policies via Supabase API...\n');

  const sql = `
-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on posts
DROP POLICY IF EXISTS "Allow authenticated users to create posts" ON posts;
DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

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

  try {
    // Use Supabase REST API to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to execute SQL via API:', error);
      
      // Try alternative approach
      console.log('\n📝 Please run this SQL in Supabase SQL Editor:');
      console.log('Go to: https://supabase.com/dashboard/project/yvzinotrjggncbwflxok/sql/new\n');
      console.log('--- COPY SQL BELOW ---');
      console.log(sql);
      console.log('--- END SQL ---\n');
      
      return;
    }

    console.log('✅ RLS policies applied successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nℹ️  The Supabase API may not support direct SQL execution.');
    console.log('Please apply the SQL manually in the Supabase dashboard.');
  }
}

applyRLSPolicies().catch(console.error);