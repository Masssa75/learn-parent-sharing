import { NextRequest, NextResponse } from 'next/server'

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
      
      return NextResponse.json({ 
        authenticated: true,
        userId: sessionData.userId,
        telegramId: sessionData.telegramId
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