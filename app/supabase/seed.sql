-- Seed file for test users
-- This creates test users for development and testing purposes

-- Create regular test user
INSERT INTO users (telegram_id, telegram_username, first_name, last_name, photo_url)
VALUES (
  999999999,
  'devtest',
  'Dev',
  'Test',
  null
)
ON CONFLICT (telegram_id) DO UPDATE SET
  telegram_username = EXCLUDED.telegram_username,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Create admin test user
INSERT INTO users (telegram_id, telegram_username, first_name, last_name, photo_url)
VALUES (
  888888888,
  'admintest',
  'Admin',
  'Test',
  null
)
ON CONFLICT (telegram_id) DO UPDATE SET
  telegram_username = EXCLUDED.telegram_username,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Create profiles for test users
INSERT INTO profiles (user_id, bio, location, website, is_admin)
SELECT id, 'Test user for development', 'Test Location', 'https://example.com', false
FROM users WHERE telegram_id = 999999999
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO profiles (user_id, bio, location, website, is_admin)
SELECT id, 'Admin test user for development', 'Admin Location', 'https://admin.example.com', true
FROM users WHERE telegram_id = 888888888
ON CONFLICT (user_id) DO NOTHING;

-- Grant the test users some sample data permissions
-- (Add any additional test data setup here)

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'Test users created successfully:';
  RAISE NOTICE '- Regular user: telegram_id=999999999, username=devtest';
  RAISE NOTICE '- Admin user: telegram_id=888888888, username=admintest';
END $$;