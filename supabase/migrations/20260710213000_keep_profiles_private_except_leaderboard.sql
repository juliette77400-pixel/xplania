-- Keep profile identity private outside the leaderboard edge function.
--
-- RLS already restricts direct reads from public.profiles to the owner, but
-- these SECURITY DEFINER helpers used to bypass that policy and expose
-- display_name/avatar_url to public or authenticated clients.

CREATE OR REPLACE FUNCTION public.get_public_display_name(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULL::text;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_display_name(uuid) TO anon, authenticated;

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
  SELECT
    r.id,
    r.place_id,
    r.rating,
    r.tags,
    r.comment,
    r.created_at,
    r.updated_at,
    NULL::text AS author_display_name,
    NULL::text AS author_avatar_url
  FROM public.place_ratings r
  WHERE r.place_id = _place_id
  ORDER BY r.updated_at DESC
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION public.list_place_ratings_public(uuid) TO anon, authenticated;
