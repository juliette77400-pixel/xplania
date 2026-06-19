
-- 1. Drop overly-permissive public SELECT policies on explore-related tables.
DROP POLICY IF EXISTS "Public view shared nodes" ON public.explore_nodes;
DROP POLICY IF EXISTS "Public view shared edges" ON public.explore_edges;
DROP POLICY IF EXISTS "Public view shared media" ON public.explore_node_media;
DROP POLICY IF EXISTS "Public view shared progress" ON public.explore_progress;
DROP POLICY IF EXISTS "Public view shared checkins" ON public.trip_checkins;
DROP POLICY IF EXISTS "Public view shared explore badges" ON public.explore_badges;

-- 2. Revoke EXECUTE on trigger / internal helper SECURITY DEFINER functions
-- from PUBLIC, anon and authenticated. They are invoked by triggers or by
-- other SECURITY DEFINER functions, never directly from the client.
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.recalc_place_rating()',
    'public.recalc_explore_progress_from_badge()',
    'public.recalc_explore_progress()',
    'public.recalc_node_media_count()',
    'public.normalize_premium_waitlist_email()',
    'public.update_updated_at_column()',
    'public.handle_new_user()',
    'public.owns_place_list(uuid, uuid)',
    'public.get_public_display_name(uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn);
  END LOOP;
END $$;

-- Re-grant EXECUTE only where actually needed:
-- get_public_display_name is used by app to resolve display names; keep it
-- available to authenticated only (not anon).
GRANT EXECUTE ON FUNCTION public.get_public_display_name(uuid) TO authenticated;

-- Functions explicitly meant to be callable from the client (kept as-is, just
-- re-asserting the intended grants for clarity):
GRANT EXECUTE ON FUNCTION public.get_waitlist_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_to_waitlist(text, text, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_trip_tracking(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_trip_activities(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_trip_positions(text) TO anon, authenticated;
