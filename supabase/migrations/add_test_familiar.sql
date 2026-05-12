-- Adiciona familiar de teste para dcchaves25@gmail.com
-- Vincula ao primeiro paciente do tenant da terapeuta thaisfreitasmartins@gmail.com

INSERT INTO family_access (patient_id, email, nome, relacao, status, approved_at)
SELECT
  p.id,
  'dcchaves25@gmail.com',
  'Diego Chaves',
  'pai',
  'ativo',
  now()
FROM patients p
WHERE p.tenant_id = (
  SELECT id FROM users WHERE email = 'thaisfreitasmartins@gmail.com'
)
AND NOT EXISTS (
  SELECT 1 FROM family_access
  WHERE email = 'dcchaves25@gmail.com'
  AND patient_id = p.id
)
LIMIT 1;
