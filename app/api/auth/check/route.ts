import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
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
      
      // Check if session is still valid (basic check)
      const sessionAge = Date.now() - sessionData.createdAt
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
      
      if (sessionAge > maxAge) {
        return NextResponse.json({ authenticated: false })
      }
      
      // Fetch user data from database with join to profiles for points data
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id, 
          telegram_id, 
          telegram_username, 
          first_name, 
          last_name, 
          photo_url, 
          is_admin,
          profiles (
            points,
            total_xp,
            level
          )
        `)
        .eq('id', sessionData.userId)
        .single()
      
      if (error || !user) {
        console.error('Error fetching user data:', error)
        return NextResponse.json({ authenticated: false })
      }
      
      // Debug log for points data
      console.log('User profiles data:', JSON.stringify(user.profiles, null, 2))
      
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
          points: user.profiles ? (user.profiles[0]?.points || user.profiles.points || 0) : 0,
          totalXp: user.profiles ? (user.profiles[0]?.total_xp || user.profiles.total_xp || 0) : 0,
          level: user.profiles ? (user.profiles[0]?.level || user.profiles.level || 1) : 1
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