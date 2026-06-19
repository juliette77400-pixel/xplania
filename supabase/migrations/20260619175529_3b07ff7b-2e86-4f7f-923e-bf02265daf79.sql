
-- 1) Place reviews: author-only SELECT
DROP POLICY IF EXISTS "Reviews viewable by authenticated" ON public.place_reviews;
CREATE POLICY "Users read own reviews"
  ON public.place_reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2) Storage policies for the now-private 'place-reviews' bucket
DROP POLICY IF EXISTS "place-reviews authenticated read" ON storage.objects;
CREATE POLICY "place-reviews authenticated read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'place-reviews');

DROP POLICY IF EXISTS "place-reviews owner upload" ON storage.objects;
CREATE POLICY "place-reviews owner upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'place-reviews' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "place-reviews owner update" ON storage.objects;
CREATE POLICY "place-reviews owner update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'place-reviews' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "place-reviews owner delete" ON storage.objects;
CREATE POLICY "place-reviews owner delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'place-reviews' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3) Tighten SECURITY DEFINER exposure where possible
-- gam_user_points: only called by signed-in users in the app; revoke from anon.
REVOKE EXECUTE ON FUNCTION public.gam_user_points(uuid) FROM PUBLIC, anon;
-- get_public_display_name: only used by signed-in flows; revoke from anon.
REVOKE EXECUTE ON FUNCTION public.get_public_display_name(uuid) FROM PUBLIC, anon;
