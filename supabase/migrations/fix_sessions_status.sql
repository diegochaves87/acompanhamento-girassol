-- Corrige a constraint de status das sessões para incluir todos os valores usados no frontend
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;

ALTER TABLE sessions ADD CONSTRAINT sessions_status_check
  CHECK (status IN (
    'scheduled',
    'confirmed',
    'completed',
    'cancelled',
    'missed',
    'makeup',
    'justified_absence',
    'unjustified_absence',
    'rescheduled'
  ));
