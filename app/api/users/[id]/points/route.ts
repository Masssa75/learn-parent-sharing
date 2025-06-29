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
    const { id } = await params
    
    // Get profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('points, total_xp, level')
      .eq('user_id', id)
      .single()
    
    if (error || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile not found' 
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        points: profile.points || 0,
        totalXp: profile.total_xp || 0,
        level: profile.level || 1
      }
    })
  } catch (error) {
    console.error('Error fetching points:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}