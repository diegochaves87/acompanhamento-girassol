-- Add reposition tracking columns to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS reposition_session_id UUID REFERENCES sessions(id);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS original_status TEXT;

-- reposition_session_id: ID of the lost session this makeup covers
-- original_status: stores the original status before becoming 'reposta'
