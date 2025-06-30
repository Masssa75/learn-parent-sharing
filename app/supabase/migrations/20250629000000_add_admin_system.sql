-- Add admin system to users table

-- Add is_admin column to users table
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Create admin_users table to track admin metadata
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES users(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX idx_users_is_admin ON users(is_admin);

-- Update RLS policies for users table to include admin status
-- Allow everyone to see basic user info including admin status
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Only admins can update user records
CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admin users table policies
-- Only admins can view admin_users table
CREATE POLICY "Only admins can view admin_users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can insert into admin_users table
CREATE POLICY "Only admins can insert admin_users" ON admin_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Function to make a user an admin
CREATE OR REPLACE FUNCTION make_user_admin(
  p_telegram_id BIGINT,
  p_added_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID from telegram ID
  SELECT id INTO v_user_id FROM users WHERE telegram_id = p_telegram_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with telegram_id % not found', p_telegram_id;
  END IF;
  
  -- Update user to be admin
  UPDATE users SET is_admin = TRUE WHERE id = v_user_id;
  
  -- Insert admin record
  INSERT INTO admin_users (user_id, added_by, notes)
  VALUES (v_user_id, p_added_by, p_notes)
  ON CONFLICT (user_id) DO UPDATE
    SET added_by = EXCLUDED.added_by,
        added_at = NOW(),
        notes = EXCLUDED.notes;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove admin privileges
CREATE OR REPLACE FUNCTION remove_user_admin(p_telegram_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID from telegram ID
  SELECT id INTO v_user_id FROM users WHERE telegram_id = p_telegram_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with telegram_id % not found', p_telegram_id;
  END IF;
  
  -- Update user to remove admin
  UPDATE users SET is_admin = FALSE WHERE id = v_user_id;
  
  -- Delete from admin_users table
  DELETE FROM admin_users WHERE user_id = v_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;