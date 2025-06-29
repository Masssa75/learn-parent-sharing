-- Add points and XP columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_action_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actions_this_hour INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hour_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create user_actions table for tracking all actions
CREATE TABLE user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'add_to_profile', 'add_to_watchlist', 'recommend', 'flag'
  target_type TEXT NOT NULL, -- 'post', 'comment'
  target_id UUID NOT NULL,
  points_earned INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create curation_tracking table for early discovery rewards
CREATE TABLE curation_tracking (
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

-- Create milestones table
CREATE TABLE milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  points_reward INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 0
);

-- Create user_milestones table
CREATE TABLE user_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, milestone_id)
);

-- Create power_ups table
CREATE TABLE power_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  cost_points INTEGER DEFAULT 0,
  duration_hours INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create user_power_ups table for active power-ups
CREATE TABLE user_power_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  power_up_id UUID REFERENCES power_ups(id) ON DELETE CASCADE,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create weekly_points_snapshot table for distribution tracking
CREATE TABLE weekly_points_snapshot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Insert initial milestones
INSERT INTO milestones (name, description, points_reward, xp_reward) VALUES
('first_tip', 'Submit your first parenting tip', 100, 100),
('ten_curations', 'Successfully curate 10 tips', 500, 500),
('reach_level_5', 'Reach level 5', 1000, 1000),
('thirty_day_streak', 'Active for 30 consecutive days', 2000, 2000);

-- Insert initial power-ups
INSERT INTO power_ups (name, description, cost_points, duration_hours) VALUES
('spotlight', 'Boost your tip to the top of the feed', 500, 24),
('scout_badge', 'See which tips are trending before others', 300, 48);

-- Create indexes for performance
CREATE INDEX idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX idx_user_actions_created_at ON user_actions(created_at);
CREATE INDEX idx_curation_tracking_user_id ON curation_tracking(user_id);
CREATE INDEX idx_curation_tracking_target ON curation_tracking(target_type, target_id);
CREATE INDEX idx_user_milestones_user_id ON user_milestones(user_id);
CREATE INDEX idx_user_power_ups_user_id ON user_power_ups(user_id);
CREATE INDEX idx_user_power_ups_expires ON user_power_ups(expires_at);

-- Add RLS policies
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE curation_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_points_snapshot ENABLE ROW LEVEL SECURITY;

-- User actions policies
CREATE POLICY "Users can view their own actions" ON user_actions
  FOR SELECT USING (true);

CREATE POLICY "Service can create actions" ON user_actions
  FOR INSERT WITH CHECK (true);

-- Curation tracking policies
CREATE POLICY "Service can manage curation tracking" ON curation_tracking
  FOR ALL USING (true);

-- Milestones policies (everyone can view)
CREATE POLICY "Anyone can view milestones" ON milestones
  FOR SELECT USING (true);

-- User milestones policies
CREATE POLICY "Users can view their own milestones" ON user_milestones
  FOR SELECT USING (true);

-- Power-ups policies (everyone can view available power-ups)
CREATE POLICY "Anyone can view power-ups" ON power_ups
  FOR SELECT USING (true);

-- User power-ups policies
CREATE POLICY "Users can view their own power-ups" ON user_power_ups
  FOR SELECT USING (true);

-- Weekly snapshot policies
CREATE POLICY "Service can manage snapshots" ON weekly_points_snapshot
  FOR ALL USING (true);

-- Function to calculate user level based on XP
CREATE OR REPLACE FUNCTION calculate_user_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Simple level calculation: every 1000 XP = 1 level, max level 10
  RETURN LEAST(GREATEST(1, (xp / 1000) + 1), 10);
END;
$$ LANGUAGE plpgsql;

-- Function to get rate limit for user level
CREATE OR REPLACE FUNCTION get_rate_limit(user_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  CASE
    WHEN user_level <= 2 THEN RETURN 5;
    WHEN user_level <= 5 THEN RETURN 10;
    WHEN user_level <= 8 THEN RETURN 20;
    ELSE RETURN 999; -- Unlimited for level 9-10
  END CASE;
END;
$$ LANGUAGE plpgsql;