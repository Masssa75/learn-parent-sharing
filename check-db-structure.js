require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

async function checkDBStructure() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('Checking database structure...')
    
    // Check profiles table structure
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Profiles table sample:')
      console.log(JSON.stringify(profiles[0], null, 2))
      
      if (profiles[0]) {
        console.log('\nColumn names:')
        console.log(Object.keys(profiles[0]))
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkDBStructure()