require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

async function testAuthWithPoints() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('Testing auth check with points data...')
    
    // Test the same query that the auth check uses
    const adminTestUserId = 'de2f7130-7682-4bc0-aad1-e1b83c07cb43' // admintest user
    
    console.log(`Testing with user ID: ${adminTestUserId}`)
    
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
      .eq('id', adminTestUserId)
      .single()
    
    if (error) {
      console.error('Query error:', error)
    } else {
      console.log('Query successful!')
      console.log('User data:', JSON.stringify(user, null, 2))
      
      if (user.profiles) {
        console.log('✅ Profile data found')
        console.log(`Points: ${user.profiles.points || 'null'}`)
        console.log(`XP: ${user.profiles.total_xp || 'null'}`)
        console.log(`Level: ${user.profiles.level || 'null'}`)
      } else {
        console.log('❌ No profile data')
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testAuthWithPoints()