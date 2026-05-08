-- Portal da Família: acesso de familiares ao acompanhamento do paciente

CREATE TABLE IF NOT EXISTS family_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  relacao TEXT,
  status TEXT DEFAULT 'pendente',
  invite_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

ALTER TABLE family_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "terapeuta_manage" ON family_access
  USING (patient_id IN (
    SELECT id FROM patients WHERE tenant_id = auth.uid()
  ));
