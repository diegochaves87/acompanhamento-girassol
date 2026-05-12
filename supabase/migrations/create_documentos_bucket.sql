-- Bucket para documentos dos pacientes
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas do bucket documentos
DROP POLICY IF EXISTS "documentos_select" ON storage.objects;
CREATE POLICY "documentos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documentos');

DROP POLICY IF EXISTS "documentos_insert" ON storage.objects;
CREATE POLICY "documentos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos');

DROP POLICY IF EXISTS "documentos_delete" ON storage.objects;
CREATE POLICY "documentos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documentos');
