import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface TelegramAuthData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

// Verify Telegram authentication data
function verifyTelegramAuth(authData: TelegramAuthData, botToken: string): boolean {
  const { hash, ...data } = authData
  
  // Create check string
  const checkArr = Object.keys(data)
    .sort()
    .map(key => `${key}=${(data as any)[key]}`)
  const checkString = checkArr.join('\n')
  
  // Create hash
  const secretKey = crypto
    .createHash('sha256')
    .update(botToken)
    .digest()
  
  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex')
  
  return hmac === hash
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authData = body as TelegramAuthData
    
    console.log('Telegram auth request received:', {
      id: authData.id,
      username: authData.username,
      firstName: authData.first_name,
      lastName: authData.last_name,
      photoUrl: authData.photo_url,
      hasPhoto: !!authData.photo_url,
      timestamp: new Date().toISOString()
    })
    
    // For development, skip verification if bot token is not set
    const botToken = process.env.TELEGRAM_BOT_TOKEN || 'development'
    
    if (botToken !== 'development') {
      // Verify the authentication data
      const isValid = verifyTelegramAuth(authData, botToken)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid authentication data' }, { status: 401 })
      }
      
      // Check if auth is not too old (5 minutes)
      const currentTime = Math.floor(Date.now() / 1000)
      if (currentTime - authData.auth_date > 300) {
        return NextResponse.json({ error: 'Authentication data is too old' }, { status: 401 })
      }
    }
    
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', authData.id)
      .single()
    
    let userId: string
    
    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          telegram_username: authData.username,
          first_name: authData.first_name,
          last_name: authData.last_name,
          photo_url: authData.photo_url,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', authData.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      userId = updatedUser.id
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          telegram_id: authData.id,
          telegram_username: authData.username,
          first_name: authData.first_name,
          last_name: authData.last_name,
          photo_url: authData.photo_url
        })
        .select()
        .single()
      
      if (createError) throw createError
      userId = newUser.id
      
      // Create default profile
      await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          kids_ages: [],
          interests: []
        })
    }
    
    // Create a session token (in production, use proper JWT)
    const sessionToken = Buffer.from(JSON.stringify({
      userId,
      telegramId: authData.id,
      createdAt: Date.now()
    })).toString('base64')
    
    const response = NextResponse.json({ 
      success: true, 
      userId,
      sessionToken
    })
    
    // Set session cookie with proper configuration
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
    
    console.log('Session cookie set:', {
      userId,
      cookieSet: true,
      secure: process.env.NODE_ENV === 'production'
    })
    
    return response
  } catch (error) {
    console.error('Telegram auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}