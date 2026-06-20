
DROP POLICY IF EXISTS "Ratings readable by everyone" ON public.place_ratings;

CREATE POLICY "Ratings readable by signed-in users"
  ON public.place_ratings
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.place_ratings FROM anon;
