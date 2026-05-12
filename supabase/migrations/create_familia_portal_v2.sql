-- Portal Família v2

ALTER TABLE family_access ADD COLUMN IF NOT EXISTS descricao_paciente TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS published_to_family BOOLEAN DEFAULT false;
ALTER TABLE multidisciplinary_notes ADD COLUMN IF NOT EXISTS published_to_family BOOLEAN DEFAULT false;

-- ─── Notificações ───
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own" ON notifications;
CREATE POLICY "user_own" ON notifications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Posts da família ───
CREATE TABLE IF NOT EXISTS family_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_access_id UUID REFERENCES family_access(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE family_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "family_select_posts" ON family_posts;
CREATE POLICY "family_select_posts" ON family_posts
  FOR SELECT TO authenticated
  USING (
    patient_id IN (
      SELECT patient_id FROM family_access
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "family_insert_posts" ON family_posts;
CREATE POLICY "family_insert_posts" ON family_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    family_access_id IN (
      SELECT id FROM family_access
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "family_delete_own_posts" ON family_posts;
CREATE POLICY "family_delete_own_posts" ON family_posts
  FOR DELETE TO authenticated
  USING (
    family_access_id IN (
      SELECT id FROM family_access
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "terapeuta_see_family_posts" ON family_posts;
CREATE POLICY "terapeuta_see_family_posts" ON family_posts
  FOR SELECT TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients
      WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- ─── Família pode ver paciente ───
DROP POLICY IF EXISTS "familiar_select_patient" ON patients;
CREATE POLICY "familiar_select_patient" ON patients
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT patient_id FROM family_access
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND status = 'ativo'
    )
  );

-- ─── Família pode ver sessões ───
DROP POLICY IF EXISTS "familiar_select_sessions" ON sessions;
CREATE POLICY "familiar_select_sessions" ON sessions
  FOR SELECT TO authenticated
  USING (
    patient_id IN (
      SELECT patient_id FROM family_access
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND status = 'ativo'
    )
  );

-- ─── Família pode confirmar presença ───
DROP POLICY IF EXISTS "familiar_confirm_sessions" ON sessions;
CREATE POLICY "familiar_confirm_sessions" ON sessions
  FOR UPDATE TO authenticated
  USING (
    patient_id IN (
      SELECT patient_id FROM family_access
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND status = 'ativo'
    )
  );

-- ─── Família pode ver notas publicadas ───
DROP POLICY IF EXISTS "familiar_select_notes" ON multidisciplinary_notes;
CREATE POLICY "familiar_select_notes" ON multidisciplinary_notes
  FOR SELECT TO authenticated
  USING (
    published_to_family = true AND
    patient_id IN (
      SELECT patient_id FROM family_access
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND status = 'ativo'
    )
  );

-- ─── Família pode atualizar descrição e status de seus registros ───
DROP POLICY IF EXISTS "familiar_update_own" ON family_access;
CREATE POLICY "familiar_update_own" ON family_access
  FOR UPDATE TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
