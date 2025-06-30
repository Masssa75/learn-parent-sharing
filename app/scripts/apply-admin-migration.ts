import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyAdminMigration() {
  try {
    console.log('Applying admin migration to Supabase...')
    
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250629000000_add_admin_system.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`)
      const { error } = await supabase.rpc('query', { 
        query: statement + ';' 
      }).single()
      
      if (error) {
        // Try direct execution if RPC doesn't work
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            query: statement + ';'
          })
        })
        
        if (!response.ok) {
          console.log(`Note: Statement might need manual execution: ${statement.substring(0, 50)}...`)
        }
      }
    }
    
    console.log('✅ Migration script prepared. Some statements may need manual execution in Supabase dashboard.')
    console.log('\nTo complete the migration:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the migration file content')
    console.log('4. Execute the migration')
    console.log(`\nMigration file: ${migrationPath}`)
    
  } catch (error) {
    console.error('Error applying migration:', error)
  }
}

applyAdminMigration()