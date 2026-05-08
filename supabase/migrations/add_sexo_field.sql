-- Adiciona coluna sexo nas tabelas patients e profiles
ALTER TABLE patients ADD COLUMN IF NOT EXISTS sexo TEXT DEFAULT 'nao_informado';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sexo TEXT DEFAULT 'nao_informado';
