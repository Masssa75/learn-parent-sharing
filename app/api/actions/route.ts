import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString())
    const userId = sessionData.userId
    
    console.log('Session data:', { userId, telegramId: sessionData.telegramId })
    
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }
    
    // Parse request body
    const body = await request.json()
    const { actionType, targetType, targetId } = body
    
    // Validate required fields
    if (!actionType || !targetType || !targetId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user's current profile with points info
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, points, total_xp, level')
      .eq('user_id', userId)
      .single()
    
    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError)
      console.error('Query details:', { userId, table: 'profiles', column: 'user_id' })
      return NextResponse.json({ 
        error: 'User profile not found',
        details: profileError?.message,
        userId
      }, { status: 404 })
    }
    
    // Calculate points based on action type
    let pointsEarned = 0
    switch (actionType) {
      case 'add_to_profile':
        pointsEarned = 5
        break
      case 'add_to_watchlist':
        pointsEarned = 3
        break
      case 'recommend':
        pointsEarned = 7
        break
      case 'flag':
        pointsEarned = -2
        break
      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 })
    }
    
    // Check rate limiting based on user level
    const actionsPerHour = userProfile.level <= 2 ? 5 : 
                          userProfile.level <= 5 ? 10 : 
                          userProfile.level <= 8 ? 20 : 1000 // Unlimited for levels 9-10
    
    // Count recent actions
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentActionsCount } = await supabase
      .from('user_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo)
    
    if ((recentActionsCount || 0) >= actionsPerHour) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded', 
        message: `You can only perform ${actionsPerHour} actions per hour at level ${userProfile.level}`,
        remainingActions: 0
      }, { status: 429 })
    }
    
    // Create the action record
    const { data: newAction, error: actionError } = await supabase
      .from('user_actions')
      .insert({
        user_id: userId,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        points_earned: pointsEarned
      })
      .select()
      .single()
    
    if (actionError) {
      console.error('Error creating action:', actionError)
      return NextResponse.json({ error: 'Failed to record action' }, { status: 500 })
    }
    
    // Update user's points and XP
    const newPoints = userProfile.points + (pointsEarned > 0 ? pointsEarned : 0)
    const newTotalXp = userProfile.total_xp + (pointsEarned > 0 ? pointsEarned : 0)
    const newLevel = Math.min(10, Math.floor(newTotalXp / 1000) + 1)
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        points: newPoints,
        total_xp: newTotalXp,
        level: newLevel
      })
      .eq('id', userProfile.id)
    
    if (updateError) {
      console.error('Error updating user points:', updateError)
      return NextResponse.json({ error: 'Failed to update points' }, { status: 500 })
    }
    
    // Return success response with updated user data
    return NextResponse.json({
      success: true,
      action: newAction,
      points_earned: pointsEarned,
      user: {
        points: newPoints,
        total_xp: newTotalXp,
        level: newLevel
      },
      remaining_actions: actionsPerHour - (recentActionsCount || 0) - 1
    })
    
  } catch (error) {
    console.error('Error in actions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}