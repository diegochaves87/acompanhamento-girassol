-- ─── Policy RLS: UPDATE de sessões pelo terapeuta ────────────────────────────
-- Executar no Supabase SQL Editor se o UPDATE de status estiver falhando.
--
-- Verificar policies existentes:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'sessions';

CREATE POLICY "sessions_update_therapist"
ON sessions FOR UPDATE
TO authenticated
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);
