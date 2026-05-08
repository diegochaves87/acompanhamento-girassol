-- Atualiza constraint de status para incluir todos os 12 valores usados no frontend
-- Execute no Supabase → SQL Editor
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;

ALTER TABLE sessions ADD CONSTRAINT sessions_status_check
  CHECK (status IN (
    'scheduled',
    'confirmed',
    'completed',
    'cancelled',
    'canceled_therapist',
    'cancelled_family',
    'missed',
    'makeup',
    'justified_absence',
    'unjustified_absence',
    'rescheduled',
    'holiday'
  ));
