-- Tabela para cadastros pendentes de aprovação
CREATE TABLE IF NOT EXISTS pending_users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         TEXT NOT NULL,
  cpf          TEXT,
  profissao    TEXT,
  email        TEXT NOT NULL,
  telefone     TEXT,
  endereco     TEXT,
  plano        TEXT,
  status       TEXT DEFAULT 'pendente',
  trial_days   INTEGER DEFAULT 30,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Permite inserção pública (sem auth)
ALTER TABLE pending_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert" ON pending_users FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_select" ON pending_users FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_update" ON pending_users FOR UPDATE USING (auth.uid() IS NOT NULL);
