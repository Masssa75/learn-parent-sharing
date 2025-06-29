require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

async function debugAuthQuery() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const userId = 'de2f7130-7682-4bc0-aad1-e1b83c07cb43' // admintest
  
  try {
    console.log('Testing exact auth check query...')
    
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
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Query error:', error)
    } else {
      console.log('Raw query result:')
      console.log(JSON.stringify(user, null, 2))
      
      console.log('\nProcessed user object:')
      const processedUser = {
        id: user.id,
        telegramId: user.telegram_id,
        username: user.telegram_username,
        firstName: user.first_name,
        lastName: user.last_name,
        photoUrl: user.photo_url,
        displayName: user.first_name + (user.last_name ? ` ${user.last_name}` : ''),
        isAdmin: user.is_admin || false,
        points: user.profiles ? (user.profiles[0]?.points || user.profiles.points || 0) : 0,
        totalXp: user.profiles ? (user.profiles[0]?.total_xp || user.profiles.total_xp || 0) : 0,
        level: user.profiles ? (user.profiles[0]?.level || user.profiles.level || 1) : 1
      }
      console.log(JSON.stringify(processedUser, null, 2))
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

debugAuthQuery()