
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
