-- Fix RLS policies for posts table to allow authenticated users to create posts

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