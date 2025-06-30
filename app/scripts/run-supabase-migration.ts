import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'yvzinotrjggncbwflxok'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function runMigration() {
  try {
    console.log('Running admin system migration...')
    
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250629000000_add_admin_system.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    // Use Supabase Management API to run the migration
    const response = await fetch(
      `https://${SUPABASE_PROJECT_ID}.supabase.co/rest/v1/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          query: migrationSQL
        })
      }
    )
    
    if (!response.ok) {
      console.log('\nThe Supabase Management API approach did not work.')
      console.log('\n✅ Migration file has been created successfully!')
      console.log('\nTo apply the migration, you have two options:')
      console.log('\n1. Using Supabase Dashboard (Recommended):')
      console.log('   - Go to https://supabase.com/dashboard/project/yvzinotrjggncbwflxok/sql/new')
      console.log('   - Copy and paste the migration SQL')
      console.log('   - Click "Run"')
      console.log('\n2. Using Supabase CLI:')
      console.log('   - Install: npm install -g supabase')
      console.log('   - Run: supabase db push --db-url "postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"')
      console.log(`\nMigration file location: ${migrationPath}`)
      console.log('\nThe migration will:')
      console.log('- Add is_admin column to users table')
      console.log('- Create admin_users tracking table')
      console.log('- Add helper functions for admin management')
      console.log('- Set up proper RLS policies')
    } else {
      console.log('✅ Migration applied successfully!')
    }
    
  } catch (error) {
    console.error('Error:', error)
    console.log('\nPlease apply the migration manually through the Supabase dashboard.')
  }
}

runMigration()