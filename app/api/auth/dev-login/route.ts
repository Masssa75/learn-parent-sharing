import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Dev login endpoint that uses a pre-created test user
// Requires ALLOW_DEV_LOGIN environment variable to be set
export async function POST(request: NextRequest) {
  try {
    // Security check: Only allow in development/preview environments
    if (!process.env.ALLOW_DEV_LOGIN || process.env.ALLOW_DEV_LOGIN !== 'true') {
      return NextResponse.json({ 
        error: 'Dev login is disabled', 
        hint: 'Set ALLOW_DEV_LOGIN=true in environment variables' 
      }, { status: 403 })
    }

    // Get password from request body
    const body = await request.json().catch(() => ({}))
    const { password } = body

    // Check password
    const DEV_PASSWORD = process.env.DEV_LOGIN_PASSWORD || 'test-learn-2025'
    if (!password || password !== DEV_PASSWORD) {
      return NextResponse.json({ 
        error: 'Invalid password',
        hint: 'Password is required for dev login' 
      }, { status: 401 })
    }

    // Create Supabase client with anon key (no service key needed)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Try to fetch the pre-created test user
    // This user must be created manually in Supabase dashboard first
    const TEST_TELEGRAM_ID = 999999999 // Using a different ID to avoid conflicts
    
    const { data: testUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', TEST_TELEGRAM_ID)
      .single()
    
    if (error || !testUser) {
      return NextResponse.json({ 
        error: 'Test user not found',
        instructions: [
          '1. Go to Supabase dashboard',
          '2. Navigate to Table Editor > users',
          '3. Insert a new row with:',
          `   - telegram_id: ${TEST_TELEGRAM_ID}`,
          '   - telegram_username: devtest',
          '   - first_name: Dev',
          '   - last_name: Test',
          '   - photo_url: null (optional)',
          '4. Save and try again'
        ]
      }, { status: 404 })
    }

    // Create session data for the test user
    const sessionData = {
      userId: testUser.id,
      telegramId: testUser.telegram_id,
      createdAt: Date.now()
    }

    // Encode session as base64 (matching what auth/check expects)
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64')

    // Set session cookie
    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: testUser.id,
        username: testUser.telegram_username || 'devtest',
        displayName: `${testUser.first_name || 'Dev'} ${testUser.last_name || 'Test'}`.trim()
      },
      message: 'Dev user logged in successfully' 
    })

    const cookieStore = await cookies()
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Dev login error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}