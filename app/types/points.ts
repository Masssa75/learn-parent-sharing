export type ActionType = 'add_to_profile' | 'add_to_watchlist' | 'recommend' | 'flag';
export type TargetType = 'post' | 'comment';

export interface UserAction {
  id: string;
  user_id: string;
  action_type: ActionType;
  target_type: TargetType;
  target_id: string;
  points_earned: number;
  xp_earned: number;
  created_at: string;
}

export interface UserPoints {
  points: number;
  total_xp: number;
  level: number;
  last_action_at: string | null;
  actions_this_hour: number;
  hour_reset_at: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  points_reward: number;
  xp_reward: number;
}

export interface UserMilestone {
  id: string;
  user_id: string;
  milestone_id: string;
  achieved_at: string;
  milestone?: Milestone;
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  cost_points: number;
  duration_hours: number;
  is_active: boolean;
}

export interface UserPowerUp {
  id: string;
  user_id: string;
  power_up_id: string;
  activated_at: string;
  expires_at: string;
  power_up?: PowerUp;
}

export interface PointsAnimation {
  id: string;
  points: number;
  x: number;
  y: number;
  timestamp: number;
}

export interface CurationTracking {
  id: string;
  user_id: string;
  action_id: string;
  target_type: TargetType;
  target_id: string;
  created_at: string;
  reward_earned: boolean;
  reward_points: number;
  reward_xp: number;
}