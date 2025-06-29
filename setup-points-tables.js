require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

async function setupPointsTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('Setting up points system tables...')
    
    // First, add columns to profiles table
    console.log('Adding columns to profiles table...')
    const alterProfilesSQL = `
      ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS last_action_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS actions_this_hour INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS hour_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `
    
    const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterProfilesSQL })
    if (alterError) {
      console.error('Error altering profiles table:', alterError)
    } else {
      console.log('✅ Added columns to profiles table')
    }
    
    // Create user_actions table
    console.log('Creating user_actions table...')
    const createUserActionsSQL = `
      CREATE TABLE IF NOT EXISTS user_actions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action_type TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id UUID NOT NULL,
        points_earned INTEGER DEFAULT 0,
        xp_earned INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    const { error: actionsError } = await supabase.rpc('exec_sql', { sql: createUserActionsSQL })
    if (actionsError) {
      console.error('Error creating user_actions table:', actionsError)
    } else {
      console.log('✅ Created user_actions table')
    }
    
    // Initialize profiles for existing users
    console.log('Initializing profiles for existing users...')
    
    const { data: users } = await supabase
      .from('users')
      .select('id')
    
    if (users) {
      for (const user of users) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            points: 0,
            total_xp: 0,
            level: 1,
            actions_this_hour: 0,
            hour_reset_at: new Date().toISOString()
          }, { onConflict: 'user_id' })
        
        if (profileError) {
          console.log(`Created/updated profile for user ${user.id}`)
        }
      }
      console.log(`✅ Processed ${users.length} user profiles`)
    }
    
    console.log('✅ Points system setup complete!')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

setupPointsTables()