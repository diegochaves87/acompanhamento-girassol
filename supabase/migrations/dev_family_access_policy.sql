-- Permite que dcchaves25@gmail.com leia qualquer linha de family_access (acesso de dev)
DROP POLICY IF EXISTS "dev_full_access" ON family_access;
CREATE POLICY "dev_full_access" ON family_access
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'dcchaves25@gmail.com');
