const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function applyPointsMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('supabase/migrations/20250130_add_points_system.sql', 'utf8')
    
    console.log('Applying points system migration...')
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('Migration error:', error)
    } else {
      console.log('✅ Points system migration applied successfully')
    }
    
    // Create profile records for existing users if they don't exist
    console.log('Creating profile records for existing users...')
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }
    
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
        console.log(`Warning: Could not create profile for user ${user.id}:`, profileError.message)
      } else {
        console.log(`✅ Created profile for user ${user.id}`)
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

applyPointsMigration()