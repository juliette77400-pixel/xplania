DROP POLICY IF EXISTS travel_documents_read_auth ON public.travel_documents;
CREATE POLICY travel_documents_read_admin ON public.travel_documents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "place-reviews read referenced photos" ON storage.objects;
CREATE POLICY "place-reviews read own photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'place-reviews' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Public can read media of public journals" ON storage.objects;
CREATE POLICY "Public can read media of public journals" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'journal-media'
    AND EXISTS (
      SELECT 1 FROM public.journals j
      WHERE j.is_public = true
        AND (j.id)::text = (storage.foldername(objects.name))[2]
        AND (j.user_id)::text = (storage.foldername(objects.name))[1]
    )
  );