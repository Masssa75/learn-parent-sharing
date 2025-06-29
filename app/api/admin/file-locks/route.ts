import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient()
    
    // Check if user is admin
    const sessionCookie = cookieStore.get('session')
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString())
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('telegram_id', sessionData.telegramId)
      .single()

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if table exists first
    const { error: tableError } = await supabase
      .from('file_locks')
      .select('count')
      .limit(1)
      .single()
    
    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist - return empty array
      return NextResponse.json({ 
        locks: [],
        message: 'File locks table not created yet. Please run the migration in Supabase dashboard.' 
      })
    }

    // Get all active file locks
    const { data: locks, error } = await supabase
      .from('file_locks')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('locked_at', { ascending: false })

    if (error) {
      console.error('Error fetching locks:', error)
      return NextResponse.json({ locks: [] })
    }

    return NextResponse.json({ locks: locks || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/file-locks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient()
    
    // Check authentication
    const sessionCookie = cookieStore.get('session')
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { filePath, lockedBy, description, duration = 30 } = body

    if (!filePath || !lockedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if table exists
    const { error: tableError } = await supabase
      .from('file_locks')
      .select('count')
      .limit(1)
      .single()
    
    if (tableError && tableError.code === '42P01') {
      return NextResponse.json({ 
        error: 'File locks table not created yet. Please run the migration in Supabase dashboard.' 
      }, { status: 500 })
    }

    // Calculate expiration time (duration in minutes)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + duration)

    // Check if file is already locked
    const { data: existingLock } = await supabase
      .from('file_locks')
      .select('*')
      .eq('file_path', filePath)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingLock) {
      return NextResponse.json({ 
        error: 'File is already locked',
        lock: existingLock 
      }, { status: 409 })
    }

    // Create new lock
    const { data: newLock, error } = await supabase
      .from('file_locks')
      .insert({
        file_path: filePath,
        locked_by: lockedBy,
        description,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating lock:', error)
      return NextResponse.json({ error: 'Failed to create lock' }, { status: 500 })
    }

    return NextResponse.json({ lock: newLock })
  } catch (error) {
    console.error('Error in POST /api/admin/file-locks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient()
    
    // Check authentication
    const sessionCookie = cookieStore.get('session')
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lockId = searchParams.get('id')

    if (!lockId) {
      return NextResponse.json({ error: 'Lock ID required' }, { status: 400 })
    }

    // Check if table exists
    const { error: tableError } = await supabase
      .from('file_locks')
      .select('count')
      .limit(1)
      .single()
    
    if (tableError && tableError.code === '42P01') {
      return NextResponse.json({ 
        error: 'File locks table not created yet.' 
      }, { status: 500 })
    }

    // Delete the lock
    const { error } = await supabase
      .from('file_locks')
      .delete()
      .eq('id', lockId)

    if (error) {
      console.error('Error deleting lock:', error)
      return NextResponse.json({ error: 'Failed to delete lock' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/file-locks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}