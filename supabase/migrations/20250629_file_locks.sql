-- Create file_locks table for tracking which files are being edited
CREATE TABLE IF NOT EXISTS file_locks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  locked_by TEXT NOT NULL, -- Claude instance identifier
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- Auto-unlock after timeout
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'reserved')),
  description TEXT, -- What's being done to the file
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for quick lookup
CREATE INDEX idx_file_locks_path ON file_locks(file_path);
CREATE INDEX idx_file_locks_expires ON file_locks(expires_at);

-- Function to clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM file_locks WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE file_locks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all locks
CREATE POLICY "view_file_locks" ON file_locks
  FOR SELECT
  USING (true);

-- Allow authenticated users to create locks
CREATE POLICY "create_file_locks" ON file_locks
  FOR INSERT
  WITH CHECK (true);

-- Allow users to update/delete their own locks
CREATE POLICY "manage_own_locks" ON file_locks
  FOR ALL
  USING (locked_by = current_setting('request.jwt.claims')::json->>'sub');

-- Create a view for active locks only
CREATE VIEW active_file_locks AS
SELECT * FROM file_locks
WHERE expires_at > NOW()
ORDER BY locked_at DESC;