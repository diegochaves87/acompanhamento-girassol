CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  type TEXT NOT NULL,
  -- Tipos: 'cpf_missing' | 'evolution_pending' | 'invite_accepted' | 'invite_pending' | 'collab_request'
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  action_url TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_therapist_own"
ON notifications FOR ALL
TO authenticated
USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

-- Trigger: gerar notificação quando paciente é salvo sem CPF
CREATE OR REPLACE FUNCTION notify_missing_cpf()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.cpf IS NULL OR NEW.cpf = '') THEN
    INSERT INTO notifications (tenant_id, type, patient_id, message, action_url)
    VALUES (
      NEW.tenant_id,
      'cpf_missing',
      NEW.id,
      'Paciente ' || NEW.full_name || ' está sem CPF — compartilhamento familiar bloqueado.',
      '/terapeuta/pacientes/' || NEW.id || '?aba=dados'
    )
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE notifications
    SET resolved = true, resolved_at = now()
    WHERE patient_id = NEW.id AND type = 'cpf_missing' AND resolved = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_missing_cpf
AFTER INSERT OR UPDATE OF cpf ON patients
FOR EACH ROW EXECUTE FUNCTION notify_missing_cpf();

-- Trigger: gerar notificação quando sessão completa 7 dias sem evolução
CREATE OR REPLACE FUNCTION notify_evolution_pending()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'realizada' OR NEW.status = 'completed' OR NEW.status = 'done') THEN
    INSERT INTO notifications (tenant_id, type, patient_id, message, action_url, created_at)
    SELECT
      p.tenant_id,
      'evolution_pending',
      NEW.patient_id,
      'Sessão de ' || pat.full_name || ' realizada em ' ||
        TO_CHAR(NEW.start_time::date, 'DD/MM/YYYY') || ' ainda sem evolução registrada.',
      '/terapeuta/pacientes/' || NEW.patient_id || '?aba=evolucoes',
      now() + interval '7 days'
    FROM profiles p
    JOIN patients pat ON pat.id = NEW.patient_id
    WHERE p.id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM evolutions e
      WHERE e.patient_id = NEW.patient_id
      AND e.session_id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_evolution_pending
AFTER UPDATE OF status ON sessions
FOR EACH ROW EXECUTE FUNCTION notify_evolution_pending();
