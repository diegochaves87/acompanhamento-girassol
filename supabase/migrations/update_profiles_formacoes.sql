ALTER TABLE profiles ADD COLUMN IF NOT EXISTS formacoes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS especialidades JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pending_users ADD COLUMN IF NOT EXISTS formacoes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pending_users ADD COLUMN IF NOT EXISTS especialidades JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pending_users ADD COLUMN IF NOT EXISTS sexo TEXT;
