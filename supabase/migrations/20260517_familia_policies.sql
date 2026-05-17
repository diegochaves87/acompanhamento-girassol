-- ─── Políticas RLS — Portal da Família ──────────────────────────────────────
-- Aplicar no Supabase SQL Editor após o deploy do código.
-- Habilitar RLS nas tabelas antes de criar as políticas, se ainda não estiver ativo.

-- ── Evoluções ──────────────────────────────────────────────────────────────

CREATE POLICY "familia_le_evolucoes"
ON evolutions FOR SELECT
TO authenticated
USING (
  published_to_family = true
  AND patient_id IN (
    SELECT patient_id FROM family_access
    WHERE email = auth.email()
    AND status = 'ativo'
  )
);

-- ── Relatórios ─────────────────────────────────────────────────────────────

CREATE POLICY "familia_le_relatorios"
ON relatorios FOR SELECT
TO authenticated
USING (
  conteudo_humanizado IS NOT NULL
  AND patient_id IN (
    SELECT patient_id FROM family_access
    WHERE email = auth.email()
    AND status = 'ativo'
  )
);

-- ── Pacientes ──────────────────────────────────────────────────────────────

CREATE POLICY "familia_le_paciente"
ON patients FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT patient_id FROM family_access
    WHERE email = auth.email()
    AND status = 'ativo'
  )
);

-- ── Sessões ────────────────────────────────────────────────────────────────

CREATE POLICY "familia_le_sessoes"
ON sessions FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT patient_id FROM family_access
    WHERE email = auth.email()
    AND status = 'ativo'
  )
);

-- ── Acesso familiar (próprio registro) ────────────────────────────────────

CREATE POLICY "familia_le_proprio_acesso"
ON family_access FOR SELECT
TO authenticated
USING (email = auth.email());
