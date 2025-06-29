require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

async function fixProfilesIndividual() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('Fixing profiles individually...')
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, points, total_xp, level')
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return
    }
    
    console.log(`Found ${profiles.length} profiles`)
    
    for (const profile of profiles) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          points: profile.points || 0,
          total_xp: profile.total_xp || 0,
          level: profile.level || 1,
          actions_this_hour: 0,
          hour_reset_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id)
      
      if (updateError) {
        console.log(`Error updating profile ${profile.user_id}:`, updateError.message)
      } else {
        console.log(`✅ Updated profile ${profile.user_id}`)
      }
    }
    
    console.log('✅ All profiles updated!')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixProfilesIndividual()