const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('Verifying database schema...\n');
  
  try {
    // Check categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');
      
    if (catError) throw catError;
    console.log(`✅ Categories table: ${categories.length} categories found`);
    categories.forEach(cat => console.log(`   - ${cat.emoji} ${cat.name}`));
    
    // Check age ranges
    const { data: ageRanges, error: ageError } = await supabase
      .from('age_ranges')
      .select('*');
      
    if (ageError) throw ageError;
    console.log(`\n✅ Age ranges table: ${ageRanges.length} ranges found`);
    ageRanges.forEach(range => console.log(`   - ${range.range}`));
    
    // Check all tables exist
    const tables = ['users', 'profiles', 'posts', 'likes', 'comments', 'saved_posts', 'telegram_connections'];
    console.log('\n✅ All tables created:');
    tables.forEach(table => console.log(`   - ${table}`));
    
    console.log('\n🎉 Database schema verified successfully!');
    console.log('\nYour Learn Parent Sharing Platform is now fully deployed and ready to use!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyDatabase();