const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfilesStructure() {
  console.log('Checking profiles table structure...\n');
  
  try {
    // Get a sample profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    
    console.log('Sample profile record:');
    console.log(JSON.stringify(profile, null, 2));
    
    console.log('\nColumns found:');
    Object.keys(profile).forEach(key => {
      console.log(`  - ${key}: ${typeof profile[key]}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkProfilesStructure();