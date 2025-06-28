const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkCategories() {
  console.log('🔍 Checking categories in database...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get all categories
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('❌ Error fetching categories:', error.message);
    return;
  }
  
  console.log(`Found ${categories.length} categories:\n`);
  categories.forEach(cat => {
    console.log(`ID: ${cat.id}`);
    console.log(`Name: ${cat.name}`);
    console.log(`Emoji: ${cat.emoji || 'None'}`);
    console.log(`Slug: ${cat.slug || 'None'}`);
    console.log('---');
  });
  
  // Check specific category
  console.log('\n🔍 Looking for "Apps & Software"...');
  const { data: appCat, error: appError } = await supabase
    .from('categories')
    .select('*')
    .eq('name', 'Apps & Software')
    .single();
    
  if (appError) {
    console.log('❌ Not found:', appError.message);
  } else {
    console.log('✅ Found:', appCat);
  }
}

checkCategories().catch(console.error);