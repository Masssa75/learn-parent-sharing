-- Add RLS policy to allow reading users for dev login
-- This allows the anon role to read specific test users

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow reading test users" ON users;

-- Create policy to allow reading test users
CREATE POLICY "Allow reading test users" ON users
  FOR SELECT
  TO anon
  USING (telegram_id IN (999999999, 888888888));

-- Also allow authenticated users to read all users (for future features)
DROP POLICY IF EXISTS "Allow authenticated users to read all users" ON users;

CREATE POLICY "Allow authenticated users to read all users" ON users
  FOR SELECT
  TO authenticated
  USING (true);