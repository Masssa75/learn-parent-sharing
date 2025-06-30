import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Mock login that doesn't require database access
export async function POST() {
  try {
    // Create a mock user session without database
    const mockUser = {
      id: 'mock-user-123',
      telegram_id: 123456789,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      photo_url: null
    }

    // Create session
    const sessionData = {
      user: mockUser,
      createdAt: new Date().toISOString()
    }

    const sessionToken = JSON.stringify(sessionData)

    // Set session cookie
    const response = NextResponse.json({ 
      success: true, 
      user: mockUser,
      message: 'Mock user logged in successfully' 
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
    console.error('Mock login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}