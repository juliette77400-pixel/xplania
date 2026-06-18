
-- 1) profiles: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Public helper to fetch a single display name (used by public shared carnet page)
CREATE OR REPLACE FUNCTION public.get_public_display_name(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT display_name FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_display_name(uuid) TO anon, authenticated;

-- 2) mood_reactions: remove broad authenticated SELECT, restrict to owner;
--    expose social-safe columns via a view (no lat/lng, no user_id).
DROP POLICY IF EXISTS "Authenticated users can view mood reactions" ON public.mood_reactions;

CREATE POLICY "Users view own mood reactions"
  ON public.mood_reactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.mood_reactions_public
WITH (security_invoker = on) AS
  SELECT
    id,
    place_id,
    mood,
    emoji,
    comment,
    place_name,
    created_at
  FROM public.mood_reactions;

GRANT SELECT ON public.mood_reactions_public TO anon, authenticated;
