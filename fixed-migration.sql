-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service can create actions" ON user_actions;
DROP POLICY IF EXISTS "Users can view all actions" ON user_actions;

-- Create new policies with unique names
CREATE POLICY "actions_select_all" ON user_actions
  FOR SELECT USING (true);

CREATE POLICY "actions_insert_all" ON user_actions
  FOR INSERT WITH CHECK (true);

-- Create milestones table if it doesn't exist
CREATE TABLE IF NOT EXISTS milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  points_reward INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 0
);

-- Insert milestones if they don't exist
INSERT INTO milestones (name, description, points_reward, xp_reward) 
SELECT * FROM (VALUES
  ('first_tip', 'Submit your first parenting tip', 100, 100),
  ('ten_curations', 'Successfully curate 10 tips', 500, 500),
  ('reach_level_5', 'Reach level 5', 1000, 1000),
  ('thirty_day_streak', 'Active for 30 consecutive days', 2000, 2000)
) AS v(name, description, points_reward, xp_reward)
WHERE NOT EXISTS (SELECT 1 FROM milestones WHERE milestones.name = v.name);

-- Create user_milestones table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, milestone_id)
);

-- Enable RLS for milestones tables if not already enabled
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view milestones" ON milestones;
DROP POLICY IF EXISTS "Users can view milestones" ON user_milestones;

-- Create policies with unique names
CREATE POLICY "milestones_select_all" ON milestones
  FOR SELECT USING (true);

CREATE POLICY "user_milestones_select_all" ON user_milestones
  FOR SELECT USING (true);

-- Create curation_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS curation_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_id UUID REFERENCES user_actions(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reward_earned BOOLEAN DEFAULT FALSE,
  reward_points INTEGER DEFAULT 0,
  reward_xp INTEGER DEFAULT 0
);

-- Enable RLS and create policy
ALTER TABLE curation_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curation_tracking_all" ON curation_tracking
  FOR ALL USING (true);

-- Create power_ups table if it doesn't exist
CREATE TABLE IF NOT EXISTS power_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  cost_points INTEGER DEFAULT 0,
  duration_hours INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE
);

-- Insert initial power-ups
INSERT INTO power_ups (name, description, cost_points, duration_hours) 
SELECT * FROM (VALUES
  ('spotlight', 'Boost your tip to the top of the feed', 500, 24),
  ('scout_badge', 'See which tips are trending before others', 300, 48)
) AS v(name, description, cost_points, duration_hours)
WHERE NOT EXISTS (SELECT 1 FROM power_ups WHERE power_ups.name = v.name);

-- Create user_power_ups table
CREATE TABLE IF NOT EXISTS user_power_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  power_up_id UUID REFERENCES power_ups(id) ON DELETE CASCADE,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS for power-ups tables
ALTER TABLE power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_power_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "power_ups_select_all" ON power_ups
  FOR SELECT USING (true);

CREATE POLICY "user_power_ups_select_all" ON user_power_ups
  FOR SELECT USING (true);