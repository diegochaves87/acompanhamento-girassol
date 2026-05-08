-- Garante RLS habilitado na tabela
ALTER TABLE family_access ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas conflitantes
DROP POLICY IF EXISTS "terapeuta_manage" ON family_access;
DROP POLICY IF EXISTS "terapeuta_insert_family_access" ON family_access;
DROP POLICY IF EXISTS "terapeuta_select" ON family_access;
DROP POLICY IF EXISTS "terapeuta_update" ON family_access;
DROP POLICY IF EXISTS "terapeuta_delete" ON family_access;

-- SELECT: terapeuta vê apenas os familiares dos seus pacientes
CREATE POLICY "terapeuta_select" ON family_access
  FOR SELECT TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients
      WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- INSERT: terapeuta pode criar convites apenas para seus pacientes
CREATE POLICY "terapeuta_insert" ON family_access
  FOR INSERT TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients
      WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- UPDATE: terapeuta pode atualizar (ex: aprovar acesso)
CREATE POLICY "terapeuta_update" ON family_access
  FOR UPDATE TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients
      WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- DELETE: terapeuta pode remover acessos
CREATE POLICY "terapeuta_delete" ON family_access
  FOR DELETE TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients
      WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- Familiar autenticado pode ver seu próprio registro via email
CREATE POLICY "familiar_select_own" ON family_access
  FOR SELECT TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
