-- Permite que terapeuta autenticado insira notas (sem precisar de service role)
ALTER TABLE multidisciplinary_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notes_insert_author" ON multidisciplinary_notes;
CREATE POLICY "notes_insert_author" ON multidisciplinary_notes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Garante que context_type aceita 'nota_interna'
ALTER TABLE multidisciplinary_notes
  DROP CONSTRAINT IF EXISTS multidisciplinary_notes_context_type_check;

ALTER TABLE multidisciplinary_notes
  ADD CONSTRAINT multidisciplinary_notes_context_type_check
  CHECK (context_type IS NULL OR context_type IN (
    'session_note',
    'prescription',
    'referral',
    'evaluation',
    'multidisciplinary',
    'nota_interna',
    'other'
  ));
