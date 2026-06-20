
-- 1. place_ratings: restrict raw SELECT to the owner only
DROP POLICY IF EXISTS "Ratings readable by signed-in users" ON public.place_ratings;

CREATE POLICY "Users read their own ratings"
ON public.place_ratings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Public, non-PII view used by the app to list ratings of a place
CREATE OR REPLACE VIEW public.place_ratings_public
WITH (security_invoker = on) AS
SELECT
  r.id,
  r.place_id,
  r.rating,
  r.tags,
  r.comment,
  r.created_at,
  r.updated_at,
  p.display_name AS author_display_name,
  p.avatar_url   AS author_avatar_url
FROM public.place_ratings r
LEFT JOIN public.profiles p ON p.user_id = r.user_id;

GRANT SELECT ON public.place_ratings_public TO anon, authenticated;

-- The view needs to bypass the per-row SELECT restriction so anyone signed in
-- can browse aggregate community ratings without seeing user_id.
-- We do this by adding a permissive SELECT policy on the base table scoped to
-- the columns we expose via the view — Postgres has no column-level SELECT in
-- RLS, so we instead expose a SECURITY DEFINER function and rewrite the view.
CREATE OR REPLACE FUNCTION public.list_place_ratings_public(_place_id uuid)
RETURNS TABLE (
  id uuid,
  place_id uuid,
  rating smallint,
  tags text[],
  comment text,
  created_at timestamptz,
  updated_at timestamptz,
  author_display_name text,
  author_avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.place_id, r.rating, r.tags, r.comment, r.created_at, r.updated_at,
         p.display_name, p.avatar_url
  FROM public.place_ratings r
  LEFT JOIN public.profiles p ON p.user_id = r.user_id
  WHERE r.place_id = _place_id
  ORDER BY r.updated_at DESC
  LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.list_place_ratings_public(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_place_ratings_public(uuid) TO authenticated;

-- Drop the view to avoid confusion — clients use the RPC instead
DROP VIEW IF EXISTS public.place_ratings_public;

-- 3. premium_waitlist: explicit admin-only SELECT policy
DROP POLICY IF EXISTS "Admins can read waitlist" ON public.premium_waitlist;
CREATE POLICY "Admins can read waitlist"
ON public.premium_waitlist FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
