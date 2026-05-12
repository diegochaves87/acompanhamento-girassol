-- RLS para multidisciplinary_notes: terapeuta pode deletar suas próprias notas
ALTER TABLE multidisciplinary_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notes_delete_author" ON multidisciplinary_notes;
CREATE POLICY "notes_delete_author" ON multidisciplinary_notes
  FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- Permite que o terapeuta atualize published_to_family nas suas notas
DROP POLICY IF EXISTS "notes_update_author" ON multidisciplinary_notes;
CREATE POLICY "notes_update_author" ON multidisciplinary_notes
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Leitura: terapeuta vê notas do seu tenant
DROP POLICY IF EXISTS "notes_select_tenant" ON multidisciplinary_notes;
CREATE POLICY "notes_select_tenant" ON multidisciplinary_notes
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );
