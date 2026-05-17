-- Add reposition_scheduled_at to track the date of the makeup session on the original session
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS reposition_scheduled_at TIMESTAMPTZ;
-- reposition_scheduled_at: set on the original (reposta) session — stores when the makeup session was scheduled
