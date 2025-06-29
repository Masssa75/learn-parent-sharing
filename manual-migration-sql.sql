-- Create user_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  points_earned INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON user_actions(created_at);

-- Enable RLS
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view all actions" ON user_actions
  FOR SELECT USING (true);

CREATE POLICY "Service can create actions" ON user_actions
  FOR INSERT WITH CHECK (true);

-- Create milestones table
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

-- Create user_milestones table
CREATE TABLE IF NOT EXISTS user_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, milestone_id)
);

-- Enable RLS for milestones tables
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view milestones" ON milestones
  FOR SELECT USING (true);

CREATE POLICY "Users can view milestones" ON user_milestones
  FOR SELECT USING (true);