-- Remove a policy que restringe SELECT por author_id (impede ver notas de outros terapeutas do mesmo tenant)
DROP POLICY IF EXISTS "Terapeuta le anotacoes" ON multidisciplinary_notes;

-- Recriar delete policy apenas por author_id (autor pode excluir suas próprias notas)
DROP POLICY IF EXISTS "notes_delete_author" ON multidisciplinary_notes;

CREATE POLICY "notes_delete_author"
ON multidisciplinary_notes FOR DELETE
TO authenticated
USING (auth.uid() = author_id);
