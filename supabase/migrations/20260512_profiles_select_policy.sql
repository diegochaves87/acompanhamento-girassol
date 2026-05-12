-- Permite que terapeutas autenticados leiam perfis (para exibir nome do autor nas anotações)
-- Executar no Supabase SQL Editor

CREATE POLICY "Terapeuta le perfis para anotacoes"
ON profiles FOR SELECT
TO authenticated
USING (true);
