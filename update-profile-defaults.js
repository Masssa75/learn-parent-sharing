require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

async function updateProfileDefaults() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('Updating profile defaults...')
    
    // Update all profiles to have default values for points system
    const { data, error } = await supabase
      .from('profiles')
      .update({
        points: 0,
        total_xp: 0,
        level: 1,
        actions_this_hour: 0,
        hour_reset_at: new Date().toISOString()
      })
      .is('points', null) // Only update records where points is null
      .select()
    
    if (error) {
      console.error('Update error:', error)
    } else {
      console.log(`✅ Updated ${data?.length || 0} profiles with default values`)
      
      // Update all profiles regardless of null check
      const { data: allData, error: allError } = await supabase
        .from('profiles')
        .update({
          points: 0,
          total_xp: 0,
          level: 1,
          actions_this_hour: 0,
          hour_reset_at: new Date().toISOString()
        })
        .select()
      
      if (allError) {
        console.error('Error updating all profiles:', allError)
      } else {
        console.log(`✅ Updated all ${allData?.length || 0} profiles`)
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

updateProfileDefaults()