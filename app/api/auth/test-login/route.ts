import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// IMPORTANT: This endpoint is for testing only and should be removed in production
export async function POST() {
  try {
    // For testing purposes - in production this should check environment variables
    console.log('Test login endpoint called');

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Check if test user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', 123456789)
      .single()

    let testUser = existingUser

    // Create test user if doesn't exist
    if (!existingUser) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          telegram_id: 123456789,
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          photo_url: null
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating test user:', createError)
        return NextResponse.json({ error: 'Failed to create test user' }, { status: 500 })
      }

      testUser = newUser
    }

    // Create session
    const sessionData = {
      user: {
        id: testUser.id,
        telegram_id: testUser.telegram_id,
        username: testUser.username,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        photo_url: testUser.photo_url
      },
      createdAt: new Date().toISOString()
    }

    const sessionToken = JSON.stringify(sessionData)

    // Set session cookie
    const response = NextResponse.json({ 
      success: true, 
      user: sessionData.user,
      message: 'Test user logged in successfully' 
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
    console.error('Test login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}