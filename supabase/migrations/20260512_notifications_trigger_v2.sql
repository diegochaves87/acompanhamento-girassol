-- Updated trigger: notify when CPF is missing OR guardian email is missing
-- Replaces the original notify_missing_cpf trigger

CREATE OR REPLACE FUNCTION notify_missing_cpf()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id uuid;
  v_cpf text;
  v_has_email boolean;
  v_missing text;
  v_msg text;
BEGIN
  v_tenant_id := NEW.tenant_id;
  v_cpf := TRIM(COALESCE(NEW.cpf, ''));

  -- Check if guardian email exists in family_patient
  SELECT EXISTS (
    SELECT 1
    FROM family_patient fp
    WHERE fp.patient_id = NEW.id
      AND fp.guardian_email IS NOT NULL
      AND TRIM(fp.guardian_email) <> ''
  ) INTO v_has_email;

  -- Determine what is missing
  IF (v_cpf = '' OR v_cpf = '""') AND NOT v_has_email THEN
    v_missing := 'CPF e e-mail do responsável';
  ELSIF v_cpf = '' OR v_cpf = '""' THEN
    v_missing := 'CPF';
  ELSIF NOT v_has_email THEN
    v_missing := 'e-mail do responsável';
  ELSE
    -- Nothing missing — remove any open notification for this patient
    UPDATE notifications
    SET lida = true
    WHERE patient_id = NEW.id
      AND tipo = 'cpf_missing'
      AND lida = false;
    RETURN NEW;
  END IF;

  v_msg := 'Paciente ' || NEW.full_name || ' está sem ' || v_missing || ' — compartilhamento familiar bloqueado.';

  -- Insert only if no open notification already exists
  IF NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE patient_id = NEW.id
      AND tipo = 'cpf_missing'
      AND lida = false
  ) THEN
    INSERT INTO notifications (tenant_id, tipo, titulo, mensagem, action_url, lida, patient_id)
    VALUES (
      v_tenant_id,
      'cpf_missing',
      'CPF ausente',
      v_msg,
      '/terapeuta/pacientes/' || NEW.id || '?aba=dados',
      false,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if it exists, then recreate
DROP TRIGGER IF EXISTS trigger_missing_cpf ON patients;

CREATE TRIGGER trigger_missing_cpf
  AFTER INSERT OR UPDATE OF cpf ON patients
  FOR EACH ROW
  EXECUTE FUNCTION notify_missing_cpf();
