import { createClient } from '@/lib/supabase/client'
import type { ActionType, TargetType } from '@/types/points'

// Rate limits by level
const RATE_LIMITS = {
  1: 5,
  2: 5,
  3: 10,
  4: 10,
  5: 10,
  6: 20,
  7: 20,
  8: 20,
  9: 999,
  10: 999
}

// Milestone thresholds
const MILESTONES = {
  first_tip: { check: (stats: any) => stats.posts_created === 1 },
  ten_curations: { check: (stats: any) => stats.successful_curations >= 10 },
  reach_level_5: { check: (stats: any) => stats.level >= 5 },
  thirty_day_streak: { check: (stats: any) => stats.streak_days >= 30 }
}

export function calculateLevel(xp: number): number {
  return Math.min(Math.max(1, Math.floor(xp / 1000) + 1), 10)
}

export function getRateLimit(level: number): number {
  return RATE_LIMITS[level as keyof typeof RATE_LIMITS] || 5
}

export async function recordAction(
  userId: string,
  actionType: ActionType,
  targetType: TargetType,
  targetId: string,
  actorLevel: number
) {
  const supabase = createClient()
  
  // Calculate points based on action type and actor level
  let points = 0
  let xp = 0
  
  if (actionType === 'add_to_profile' || actionType === 'add_to_watchlist') {
    points = actorLevel
    xp = actorLevel
  } else if (actionType === 'flag') {
    points = -actorLevel
    xp = 0 // No XP loss for flags
  }
  
  // Record the action
  const { data: action, error } = await supabase
    .from('user_actions')
    .insert({
      user_id: userId,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      points_earned: points,
      xp_earned: xp
    })
    .select()
    .single()
  
  if (error) throw error
  
  // Get current user data
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('points, total_xp')
    .eq('user_id', userId)
    .single()
  
  const currentPoints = currentProfile?.points || 0
  const currentXp = currentProfile?.total_xp || 0
  const newPoints = Math.max(0, currentPoints + points)
  const newXp = currentXp + xp
  const newLevel = calculateLevel(newXp)
  
  // Update user's points and XP
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      points: newPoints,
      total_xp: newXp,
      level: newLevel
    })
    .eq('user_id', userId)
  
  if (updateError) throw updateError
  
  // Track for curation rewards
  if (actionType === 'add_to_profile' || actionType === 'add_to_watchlist') {
    await supabase
      .from('curation_tracking')
      .insert({
        user_id: userId,
        action_id: action.id,
        target_type: targetType,
        target_id: targetId
      })
  }
  
  return { points, xp, action }
}

export async function checkAndAwardCurationRewards(
  targetType: TargetType,
  targetId: string,
  newActorLevel: number
) {
  const supabase = createClient()
  
  // Find all users who curated this item in the last 48 hours
  const fortyEightHoursAgo = new Date()
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)
  
  const { data: curations, error } = await supabase
    .from('curation_tracking')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('reward_earned', false)
    .gte('created_at', fortyEightHoursAgo.toISOString())
  
  if (error || !curations) return
  
  // Award rewards to early curators
  for (const curation of curations) {
    const rewardPoints = newActorLevel
    const rewardXp = newActorLevel
    
    await supabase
      .from('curation_tracking')
      .update({
        reward_earned: true,
        reward_points: rewardPoints,
        reward_xp: rewardXp
      })
      .eq('id', curation.id)
    
    // Get current user data
    const { data: curatorProfile } = await supabase
      .from('profiles')
      .select('points, total_xp')
      .eq('user_id', curation.user_id)
      .single()
    
    const newCuratorPoints = (curatorProfile?.points || 0) + rewardPoints
    const newCuratorXp = (curatorProfile?.total_xp || 0) + rewardXp
    const newCuratorLevel = calculateLevel(newCuratorXp)
    
    await supabase
      .from('profiles')
      .update({
        points: newCuratorPoints,
        total_xp: newCuratorXp,
        level: newCuratorLevel
      })
      .eq('user_id', curation.user_id)
  }
}

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createClient()
  
  // Get user's current level and rate limit info
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('level, actions_this_hour, hour_reset_at')
    .eq('user_id', userId)
    .single()
  
  if (error || !profile) {
    return { allowed: false, remaining: 0 }
  }
  
  const now = new Date()
  const resetTime = new Date(profile.hour_reset_at)
  
  // Check if we need to reset the hour counter
  if (now > resetTime) {
    await supabase
      .from('profiles')
      .update({
        actions_this_hour: 0,
        hour_reset_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString()
      })
      .eq('user_id', userId)
    
    return { allowed: true, remaining: getRateLimit(profile.level) - 1 }
  }
  
  const limit = getRateLimit(profile.level)
  const remaining = limit - (profile.actions_this_hour || 0)
  
  return { allowed: remaining > 0, remaining: Math.max(0, remaining - 1) }
}

export async function incrementActionCount(userId: string) {
  const supabase = createClient()
  
  // Get current action count
  const { data: profile } = await supabase
    .from('profiles')
    .select('actions_this_hour')
    .eq('user_id', userId)
    .single()
  
  await supabase
    .from('profiles')
    .update({
      actions_this_hour: (profile?.actions_this_hour || 0) + 1,
      last_action_at: new Date().toISOString()
    })
    .eq('user_id', userId)
}

export async function checkAndAwardMilestones(userId: string) {
  const supabase = createClient()
  
  // Get user stats
  const { data: stats } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (!stats) return
  
  // Get user's current milestones
  const { data: userMilestones } = await supabase
    .from('user_milestones')
    .select('milestone_id, milestones(name)')
    .eq('user_id', userId)
  
  const achievedMilestoneNames = userMilestones?.map(um => um.milestones?.name) || []
  
  // Get all milestones
  const { data: allMilestones } = await supabase
    .from('milestones')
    .select('*')
  
  if (!allMilestones) return
  
  // Check each milestone
  for (const milestone of allMilestones) {
    if (achievedMilestoneNames.includes(milestone.name)) continue
    
    const checker = MILESTONES[milestone.name as keyof typeof MILESTONES]
    if (!checker) continue
    
    // Add dynamic stats for checking
    const enhancedStats = {
      ...stats,
      posts_created: await getPostCount(userId),
      successful_curations: await getSuccessfulCurationCount(userId),
      streak_days: await getStreakDays(userId)
    }
    
    if (checker.check(enhancedStats)) {
      // Award milestone
      await supabase
        .from('user_milestones')
        .insert({
          user_id: userId,
          milestone_id: milestone.id
        })
      
      // Get current user data for milestone rewards
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('points, total_xp')
        .eq('user_id', userId)
        .single()
      
      const newMilestonePoints = (userProfile?.points || 0) + milestone.points_reward
      const newMilestoneXp = (userProfile?.total_xp || 0) + milestone.xp_reward
      const newMilestoneLevel = calculateLevel(newMilestoneXp)
      
      // Add bonus points and XP
      await supabase
        .from('profiles')
        .update({
          points: newMilestonePoints,
          total_xp: newMilestoneXp,
          level: newMilestoneLevel
        })
        .eq('user_id', userId)
    }
  }
}

// Helper functions for milestone checking
async function getPostCount(userId: string): Promise<number> {
  const supabase = createClient()
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  return count || 0
}

async function getSuccessfulCurationCount(userId: string): Promise<number> {
  const supabase = createClient()
  const { count } = await supabase
    .from('curation_tracking')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('reward_earned', true)
  return count || 0
}

async function getStreakDays(userId: string): Promise<number> {
  // This would need a more complex implementation tracking daily activity
  // For now, return 0
  return 0
}

export async function activatePowerUp(userId: string, powerUpName: string): Promise<boolean> {
  const supabase = createClient()
  
  // Get user's current points
  const { data: profile } = await supabase
    .from('profiles')
    .select('points')
    .eq('user_id', userId)
    .single()
  
  if (!profile) return false
  
  // Get power-up details
  const { data: powerUp } = await supabase
    .from('power_ups')
    .select('*')
    .eq('name', powerUpName)
    .eq('is_active', true)
    .single()
  
  if (!powerUp || (profile.points || 0) < powerUp.cost_points) {
    return false
  }
  
  // Deduct points and activate power-up
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + powerUp.duration_hours)
  
  const { error: powerUpError } = await supabase
    .from('user_power_ups')
    .insert({
      user_id: userId,
      power_up_id: powerUp.id,
      expires_at: expiresAt.toISOString()
    })
  
  if (powerUpError) return false
  
  // Deduct points
  await supabase
    .from('profiles')
    .update({
      points: Math.max(0, (profile.points || 0) - powerUp.cost_points)
    })
    .eq('user_id', userId)
  
  return true
}