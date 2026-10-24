ALTER TABLE public.official_info_cache
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS review_note text;
ALTER TABLE public.official_info_cache
  ADD CONSTRAINT official_info_cache_review_note_len CHECK (review_note IS NULL OR char_length(review_note) <= 1000);
GRANT SELECT, UPDATE ON public.official_info_cache TO authenticated;
CREATE POLICY "Admins can read official info" ON public.official_info_cache
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can record reviews" ON public.official_info_cache
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
REVOKE UPDATE ON public.official_info_cache FROM authenticated;
GRANT UPDATE (reviewed_at, reviewed_by, review_note) ON public.official_info_cache TO authenticated;