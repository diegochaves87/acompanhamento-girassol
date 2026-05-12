-- Tabela de relatórios clínicos gerados por IA
-- Executar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS relatorios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  conteudo_humanizado TEXT,
  periodo_inicio DATE,
  periodo_fim DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE relatorios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Terapeuta gerencia proprios relatorios"
ON relatorios FOR ALL
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);
