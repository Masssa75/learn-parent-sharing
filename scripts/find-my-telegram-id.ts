import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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

async function findTelegramId(searchTerm: string) {
  try {
    console.log(`Searching for users matching: "${searchTerm}"...`)
    
    // Search by username or name
    const { data: users, error } = await supabase
      .from('users')
      .select('telegram_id, telegram_username, first_name, last_name, is_admin, created_at')
      .or(`telegram_username.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error searching users:', error)
      return
    }
    
    if (!users || users.length === 0) {
      console.log('No users found matching your search term.')
      console.log('\nTip: Log in to the platform first, then search for your username or name.')
      return
    }
    
    console.log(`\nFound ${users.length} user(s):\n`)
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Telegram ID: ${user.telegram_id}`)
      console.log(`   Username: @${user.telegram_username || 'N/A'}`)
      console.log(`   Name: ${user.first_name} ${user.last_name || ''}`)
      console.log(`   Admin: ${user.is_admin ? 'Yes' : 'No'}`)
      console.log(`   Joined: ${new Date(user.created_at).toLocaleDateString()}`)
      console.log('')
    })
    
    if (users.length === 1) {
      console.log(`\nTo make this user an admin, run:`)
      console.log(`npm run setup-admin ${users[0].telegram_id}`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// Get search term from command line argument
const searchTerm = process.argv[2]

if (!searchTerm) {
  console.log('Usage: npm run find-telegram-id <username_or_name>')
  console.log('Example: npm run find-telegram-id marcschwyn')
  console.log('\nThis will search for users by:')
  console.log('- Telegram username')
  console.log('- First name')
  console.log('- Last name')
  process.exit(1)
}

findTelegramId(searchTerm)