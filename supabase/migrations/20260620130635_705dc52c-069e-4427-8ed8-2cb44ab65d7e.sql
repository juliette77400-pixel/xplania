
-- 1) Waitlist: remove direct INSERT policy; force use of subscribe_to_waitlist RPC
DROP POLICY IF EXISTS "Anyone can join waitlist (validated)" ON public.premium_waitlist;

-- 2) Storage: tighten place-reviews SELECT
DROP POLICY IF EXISTS "place-reviews authenticated read" ON storage.objects;

CREATE POLICY "place-reviews read referenced photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'place-reviews'
  AND EXISTS (
    SELECT 1 FROM public.place_reviews pr
    WHERE pr.photo_url IS NOT NULL
      AND pr.photo_url LIKE '%/' || name
  )
);

-- 3) SECURITY DEFINER lockdown
-- Revoke execute from public/anon/authenticated on all public SECURITY DEFINER functions,
-- then grant back only where intentionally exposed.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- Re-grant for intentionally exposed RPCs
GRANT EXECUTE ON FUNCTION public.get_public_trip_tracking(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_trip_activities(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_trip_positions(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_display_name(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_place_ratings_public(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_waitlist_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_to_waitlist(text, text, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gam_user_points(uuid) TO authenticated;

-- Helpers used inside RLS policies must remain callable by the roles that hit those policies
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owns_place_list(uuid, uuid) TO anon, authenticated;
