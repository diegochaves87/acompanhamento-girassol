-- Adiciona campo published_to_family na tabela evolutions
ALTER TABLE evolutions ADD COLUMN IF NOT EXISTS published_to_family boolean NOT NULL DEFAULT false;

-- Permite que o terapeuta atualize published_to_family nas suas evoluções
ALTER TABLE evolutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "evolutions_update_tenant" ON evolutions;
CREATE POLICY "evolutions_update_tenant" ON evolutions
  FOR UPDATE TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE tenant_id = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE tenant_id = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
      )
    )
  );
