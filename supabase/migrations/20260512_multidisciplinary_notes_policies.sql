-- Políticas RLS para multidisciplinary_notes
-- Executar no Supabase SQL Editor

-- Remove políticas existentes com o mesmo nome antes de recriar
DROP POLICY IF EXISTS "Terapeuta insere anotacoes" ON multidisciplinary_notes;
DROP POLICY IF EXISTS "Terapeuta le anotacoes" ON multidisciplinary_notes;
DROP POLICY IF EXISTS "Terapeuta insere anotações" ON multidisciplinary_notes;
DROP POLICY IF EXISTS "Terapeuta lê anotações" ON multidisciplinary_notes;

CREATE POLICY "Terapeuta insere anotacoes"
ON multidisciplinary_notes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Terapeuta le anotacoes"
ON multidisciplinary_notes FOR SELECT
TO authenticated
USING (auth.uid() = author_id);
