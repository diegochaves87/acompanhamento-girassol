-- Listar todas as políticas RLS ativas no schema public
-- Executar no Supabase SQL Editor e colar o resultado

SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
