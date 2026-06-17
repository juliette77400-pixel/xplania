DROP POLICY IF EXISTS "Anyone can view mood reactions" ON public.mood_reactions;
CREATE POLICY "Authenticated users can view mood reactions"
  ON public.mood_reactions
  FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.mood_reactions FROM anon;
GRANT SELECT ON public.mood_reactions TO authenticated;