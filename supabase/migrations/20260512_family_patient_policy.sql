-- RLS policy para leitura de family_patient pelo terapeuta do mesmo tenant
CREATE POLICY "family_patient_therapist_select"
ON family_patient FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT id FROM patients
    WHERE tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  )
);
