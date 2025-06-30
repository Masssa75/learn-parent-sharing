import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupFirstAdmin(telegramId: number) {
  try {
    console.log(`Setting up admin for Telegram ID: ${telegramId}`)
    
    // First check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, telegram_username, first_name, is_admin')
      .eq('telegram_id', telegramId)
      .single()
    
    if (userError) {
      console.error('User not found. Please log in to the platform first.')
      return
    }
    
    if (user.is_admin) {
      console.log('User is already an admin!')
      return
    }
    
    // Make the user an admin using the database function
    const { data, error } = await supabase.rpc('make_user_admin', {
      p_telegram_id: telegramId,
      p_notes: 'First admin - platform owner'
    })
    
    if (error) {
      console.error('Error making user admin:', error)
      return
    }
    
    console.log(`✅ Successfully made @${user.telegram_username || user.first_name} an admin!`)
    
    // Verify the change
    const { data: updatedUser } = await supabase
      .from('users')
      .select('is_admin')
      .eq('telegram_id', telegramId)
      .single()
    
    console.log('Admin status verified:', updatedUser?.is_admin)
  } catch (error) {
    console.error('Setup failed:', error)
  }
}

// Get Telegram ID from command line argument
const telegramId = parseInt(process.argv[2])

if (!telegramId) {
  console.log('Usage: npm run setup-admin <telegram_id>')
  console.log('Example: npm run setup-admin 123456789')
  process.exit(1)
}

setupFirstAdmin(telegramId)