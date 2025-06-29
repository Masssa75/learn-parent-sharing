require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

async function simpleProfileSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('Setting up user profiles with points data...')
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }
    
    console.log(`Found ${users.length} users`)
    
    // For each user, ensure they have a profile record
    for (const user of users) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single()
      
      if (!existingProfile) {
        // Create new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            bio: null,
            kids_ages: [],
            interests: []
          })
        
        if (insertError) {
          console.log(`Error creating profile for ${user.id}:`, insertError.message)
        } else {
          console.log(`✅ Created profile for user ${user.id}`)
        }
      } else {
        console.log(`Profile already exists for user ${user.id}`)
      }
    }
    
    console.log('✅ Profile setup complete!')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

simpleProfileSetup()