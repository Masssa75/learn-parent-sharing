import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  console.log('NEW AUTH CHECK WITH POINTS ENDPOINT CALLED')
  
  try {
    const sessionCookie = request.cookies.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false })
    }
    
    // Decode the session token
    try {
      const sessionData = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString()
      )
      
      // Check if session is still valid
      const sessionAge = Date.now() - sessionData.createdAt
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
      
      if (sessionAge > maxAge) {
        return NextResponse.json({ authenticated: false })
      }
      
      // Fetch user data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionData.userId)
        .single()
      
      if (userError || !user) {
        console.error('Error fetching user data:', userError)
        return NextResponse.json({ authenticated: false })
      }
      
      // Fetch profile data separately
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('points, total_xp, level')
        .eq('user_id', sessionData.userId)
        .single()
      
      console.log('Profile data fetched:', profile)
      
      // Calculate rate limit based on user level
      const userLevel = profile?.level || 1
      const actionsPerHour = userLevel <= 2 ? 5 : 
                            userLevel <= 5 ? 10 : 
                            userLevel <= 8 ? 20 : 1000 // Unlimited for levels 9-10
      
      // Count recent actions from user_actions table
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count: recentActionsCount } = await supabase
        .from('user_actions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', sessionData.userId)
        .gte('created_at', oneHourAgo)
      
      const actionsRemaining = Math.max(0, actionsPerHour - (recentActionsCount || 0))
      
      return NextResponse.json({ 
        authenticated: true,
        userId: sessionData.userId,
        telegramId: sessionData.telegramId,
        user: {
          id: user.id,
          telegramId: user.telegram_id,
          username: user.telegram_username,
          firstName: user.first_name,
          lastName: user.last_name,
          photoUrl: user.photo_url,
          displayName: user.first_name + (user.last_name ? ` ${user.last_name}` : ''),
          isAdmin: user.is_admin || false,
          points: profile?.points || 0,
          totalXp: profile?.total_xp || 0,
          level: profile?.level || 1,
          actionsRemaining: actionsRemaining
        }
      })
    } catch (error) {
      console.error('Invalid session token:', error)
      return NextResponse.json({ authenticated: false })
    }
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}