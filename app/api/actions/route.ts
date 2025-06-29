import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { recordAction, checkRateLimit, incrementActionCount, checkAndAwardCurationRewards, checkAndAwardMilestones } from '@/lib/points-system'
import type { ActionType, TargetType } from '@/types/points'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get('session')
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    )

    // Get request data
    const { actionType, targetType, targetId } = await request.json()

    // Validate input
    const validActionTypes: ActionType[] = ['add_to_profile', 'add_to_watchlist', 'recommend', 'flag']
    const validTargetTypes: TargetType[] = ['post', 'comment']
    
    if (!validActionTypes.includes(actionType) || !validTargetTypes.includes(targetType)) {
      return NextResponse.json({ error: 'Invalid action or target type' }, { status: 400 })
    }

    // Get user's current data
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('level')
      .eq('user_id', sessionData.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check rate limit
    const { allowed, remaining } = await checkRateLimit(sessionData.userId)
    if (!allowed) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded', 
        remaining: 0,
        retryAfter: 3600 // 1 hour in seconds
      }, { status: 429 })
    }

    // Increment action count
    await incrementActionCount(sessionData.userId)

    // Get the target owner's data (for calculating points)
    let targetOwnerId: string | null = null
    if (targetType === 'post') {
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', targetId)
        .single()
      targetOwnerId = post?.user_id || null
    }

    // Record the action and update points
    const { points, xp } = await recordAction(
      sessionData.userId,
      actionType,
      targetType,
      targetId,
      user.level
    )

    // If someone is taking action on content, check for curation rewards
    if (targetOwnerId && (actionType === 'add_to_profile' || actionType === 'add_to_watchlist')) {
      await checkAndAwardCurationRewards(targetType, targetId, user.level)
    }

    // Check for milestone achievements
    await checkAndAwardMilestones(sessionData.userId)

    // Get updated user data
    const { data: updatedUser } = await supabase
      .from('profiles')
      .select('points, total_xp, level')
      .eq('user_id', sessionData.userId)
      .single()

    return NextResponse.json({
      success: true,
      points,
      xp,
      remaining,
      user: updatedUser
    })
  } catch (error) {
    console.error('Action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}