const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testFileLocks() {
  console.log('Testing file locks system...')
  
  try {
    // Test 1: Create the table if it doesn't exist
    console.log('\n1. Creating file_locks table...')
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS file_locks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        file_path TEXT NOT NULL UNIQUE,
        locked_by TEXT NOT NULL,
        locked_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'reserved')),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_file_locks_path ON file_locks(file_path);
      CREATE INDEX IF NOT EXISTS idx_file_locks_expires ON file_locks(expires_at);
      
      ALTER TABLE file_locks ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "view_file_locks" ON file_locks;
      CREATE POLICY "view_file_locks" ON file_locks
        FOR SELECT
        USING (true);
      
      DROP POLICY IF EXISTS "create_file_locks" ON file_locks;
      CREATE POLICY "create_file_locks" ON file_locks
        FOR INSERT
        WITH CHECK (true);
        
      DROP POLICY IF EXISTS "manage_own_locks" ON file_locks;
      CREATE POLICY "manage_own_locks" ON file_locks
        FOR ALL
        USING (true);
    `
    
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    })
    
    if (createError) {
      console.log('Creating table directly...')
      // If the function doesn't exist, try creating the table directly
      const { error: directError } = await supabase
        .from('file_locks')
        .select('*')
        .limit(1)
        
      if (directError && directError.code === '42P01') {
        console.log('Table does not exist. Please run the migration via Supabase dashboard.')
        return
      }
    }
    
    console.log('✅ Table ready')
    
    // Test 2: Create a test lock
    console.log('\n2. Creating test lock...')
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)
    
    const { data: newLock, error: insertError } = await supabase
      .from('file_locks')
      .insert({
        file_path: '/app/test-file.tsx',
        locked_by: 'Claude-Test-1',
        description: 'Testing file lock system',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()
      
    if (insertError) {
      console.error('❌ Error creating lock:', insertError)
      return
    }
    
    console.log('✅ Test lock created:', newLock.id)
    
    // Test 3: List all locks
    console.log('\n3. Listing all locks...')
    const { data: locks, error: selectError } = await supabase
      .from('file_locks')
      .select('*')
      .order('locked_at', { ascending: false })
      
    if (selectError) {
      console.error('❌ Error listing locks:', selectError)
      return
    }
    
    console.log(`✅ Found ${locks.length} locks:`)
    locks.forEach(lock => {
      const remaining = new Date(lock.expires_at).getTime() - Date.now()
      const minutes = Math.floor(remaining / 60000)
      console.log(`  - ${lock.file_path} (${lock.locked_by}) - ${minutes}m remaining`)
    })
    
    // Test 4: Clean up test lock
    console.log('\n4. Cleaning up test lock...')
    const { error: deleteError } = await supabase
      .from('file_locks')
      .delete()
      .eq('id', newLock.id)
      
    if (deleteError) {
      console.error('❌ Error deleting lock:', deleteError)
      return
    }
    
    console.log('✅ Test lock cleaned up')
    console.log('\n🎉 File locks system is working!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testFileLocks()