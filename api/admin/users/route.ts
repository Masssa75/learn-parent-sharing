import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to verify admin status
async function verifyAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId?: string }> {
  try {
    const sessionCookie = request.cookies.get('session')
    if (!sessionCookie) return { isAdmin: false }
    
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    )
    
    const { data: user } = await supabase
      .from('users')
      .select('id, is_admin')
      .eq('id', sessionData.userId)
      .single()
    
    return { isAdmin: user?.is_admin || false, userId: user?.id }
  } catch {
    return { isAdmin: false }
  }
}

// GET /api/admin/users - List all users (admin only)
export async function GET(request: NextRequest) {
  const { isAdmin } = await verifyAdmin(request)
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, telegram_id, telegram_username, first_name, last_name, photo_url, is_admin, created_at')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/admin/users - Make a user admin (admin only)
export async function POST(request: NextRequest) {
  const { isAdmin, userId: adminUserId } = await verifyAdmin(request)
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  try {
    const body = await request.json()
    const { telegramId, action } = body
    
    if (!telegramId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    if (action === 'make_admin') {
      // Use the database function to make user admin
      const { data, error } = await supabase.rpc('make_user_admin', {
        p_telegram_id: telegramId,
        p_added_by: adminUserId,
        p_notes: `Added by admin via API`
      })
      
      if (error) throw error
      
      return NextResponse.json({ success: true, message: 'User is now an admin' })
    } else if (action === 'remove_admin') {
      // Use the database function to remove admin
      const { data, error } = await supabase.rpc('remove_user_admin', {
        p_telegram_id: telegramId
      })
      
      if (error) throw error
      
      return NextResponse.json({ success: true, message: 'Admin privileges removed' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating admin status:', error)
    return NextResponse.json({ error: 'Failed to update admin status' }, { status: 500 })
  }
}