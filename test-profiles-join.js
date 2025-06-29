require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

async function testProfilesJoin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const userId = 'de2f7130-7682-4bc0-aad1-e1b83c07cb43' // admintest
  
  try {
    console.log('Testing different join approaches...')
    
    // Test 1: Direct profile query
    console.log('\n1. Direct profile query:')
    const { data: directProfile, error: directError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (directError) {
      console.error('Direct profile error:', directError)
    } else {
      console.log('Direct profile data:', directProfile)
    }
    
    // Test 2: Users with inner join
    console.log('\n2. Users with inner join:')
    const { data: innerJoin, error: innerError } = await supabase
      .from('users')
      .select(`
        id,
        first_name,
        profiles!inner (
          points,
          total_xp,
          level
        )
      `)
      .eq('id', userId)
      .single()
    
    if (innerError) {
      console.error('Inner join error:', innerError)
    } else {
      console.log('Inner join data:', JSON.stringify(innerJoin, null, 2))
    }
    
    // Test 3: Regular join (current approach)
    console.log('\n3. Regular join (current approach):')
    const { data: regularJoin, error: regularError } = await supabase
      .from('users')
      .select(`
        id,
        first_name,
        profiles (
          points,
          total_xp,
          level
        )
      `)
      .eq('id', userId)
      .single()
    
    if (regularError) {
      console.error('Regular join error:', regularError)
    } else {
      console.log('Regular join data:', JSON.stringify(regularJoin, null, 2))
    }
    
    // Test 4: Manual join with separate queries
    console.log('\n4. Manual join approach:')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (userError) {
      console.error('User error:', userError)
    } else {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('points, total_xp, level')
        .eq('user_id', userId)
        .single()
      
      if (profileError) {
        console.error('Profile error:', profileError)
      } else {
        console.log('Manual join result:', {
          user: { id: user.id, first_name: user.first_name },
          profile
        })
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testProfilesJoin()