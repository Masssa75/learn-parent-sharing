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
        .select('points, total_xp, level, actions_this_hour')
        .eq('user_id', sessionData.userId)
        .single()
      
      console.log('Profile data fetched:', profile)
      
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
          actionsRemaining: profile ? Math.max(0, 5 - (profile.actions_this_hour || 0)) : 5
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