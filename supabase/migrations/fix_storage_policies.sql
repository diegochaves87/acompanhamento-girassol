-- Garante que o bucket 'documentos' existe como público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documentos', 'documentos', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "public_read" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update" ON storage.objects;

-- Leitura pública para qualquer pessoa
CREATE POLICY "public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'documentos');

-- Upload apenas para autenticados
CREATE POLICY "authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos');

-- Atualização apenas para autenticados
CREATE POLICY "authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos');

-- Deleção apenas para autenticados
CREATE POLICY "authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documentos');
