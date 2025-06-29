import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    
    // Get user profile with points data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points, total_xp, level')
      .eq('user_id', userId)
      .single()
    
    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ 
        points: 0, 
        totalXp: 0, 
        level: 1,
        recentActions: 0 
      })
    }
    
    // Count recent actions for rate limiting
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentActionsCount } = await supabase
      .from('user_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo)
    
    return NextResponse.json({
      points: profile.points || 0,
      totalXp: profile.total_xp || 0,
      level: profile.level || 1,
      recentActions: recentActionsCount || 0
    })
  } catch (error) {
    console.error('Error in points API:', error)
    return NextResponse.json({ 
      points: 0, 
      totalXp: 0, 
      level: 1,
      recentActions: 0 
    })
  }
}