DROP POLICY "Authenticated users can insert places" ON public.places;

CREATE POLICY "Authenticated users can insert places"
  ON public.places FOR INSERT TO authenticated
  WITH CHECK (created_by IS NULL OR auth.uid() = created_by);