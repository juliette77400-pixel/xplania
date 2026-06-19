
-- badge-proofs bucket: users manage their own folder, admins read all
DROP POLICY IF EXISTS "badge_proofs_user_upload" ON storage.objects;
CREATE POLICY "badge_proofs_user_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'badge-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "badge_proofs_user_read" ON storage.objects;
CREATE POLICY "badge_proofs_user_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'badge-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "badge_proofs_user_delete" ON storage.objects;
CREATE POLICY "badge_proofs_user_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'badge-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
