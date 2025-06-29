const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createFileLockTable() {
  console.log('Creating file_locks table...')
  
  try {
    // Create the table
    const { error } = await supabase.rpc('exec_sql', { 
      sql: `
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
          
        DROP POLICY IF EXISTS "manage_file_locks" ON file_locks;
        CREATE POLICY "manage_file_locks" ON file_locks
          FOR ALL
          USING (true);
      `
    })
    
    if (error) {
      console.error('Error creating table via RPC:', error)
      console.log('\nTrying alternative method...')
      
      // Try creating through regular query
      const { error: directError } = await supabase
        .schema('public')
        .from('file_locks')
        .select('*')
        .limit(1)
      
      if (directError && directError.code === '42P01') {
        console.log('❌ Table creation failed. Manual creation required.')
        console.log('\nPlease execute this SQL in the Supabase dashboard:')
        console.log(`
CREATE TABLE file_locks (
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

CREATE INDEX idx_file_locks_path ON file_locks(file_path);
CREATE INDEX idx_file_locks_expires ON file_locks(expires_at);

ALTER TABLE file_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_file_locks" ON file_locks
  FOR SELECT
  USING (true);

CREATE POLICY "create_file_locks" ON file_locks
  FOR INSERT
  WITH CHECK (true);
  
CREATE POLICY "manage_file_locks" ON file_locks
  FOR ALL
  USING (true);
        `)
        return
      }
    }
    
    console.log('✅ file_locks table created successfully!')
    
    // Test the table
    const { data, error: testError } = await supabase
      .from('file_locks')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Error testing table:', testError)
    } else {
      console.log('✅ Table is accessible')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createFileLockTable()