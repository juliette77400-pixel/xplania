-- Trigger-only SECURITY DEFINER functions: fully revoke public execute
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.recalc_explore_progress_from_badge()',
    'public.audit_gam_verification_settings()',
    'public.enforce_admin_verification_settings()',
    'public.enforce_admin_claim_decision()',
    'public.audit_gam_notification_settings()',
    'public.normalize_premium_waitlist_email()',
    'public.update_updated_at_column()',
    'public.recalc_explore_progress()',
    'public.on_gam_claim_status_change()',
    'public.recalc_place_rating_combined()',
    'public.recalc_place_rating()',
    'public.recalc_node_media_count()',
    'public.handle_new_user()',
    'public.auto_grant_admin_juliette()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- RPC SECURITY DEFINER functions: revoke public, grant only needed roles
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.owns_place_list(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_place_list(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.gam_user_points(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gam_user_points(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_waitlist_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_waitlist_count() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_display_name(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_display_name(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_trip_activities(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_trip_activities(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_trip_positions(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_trip_positions(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_trip_tracking(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_trip_tracking(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.list_place_ratings_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_place_ratings_public(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.subscribe_to_waitlist(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_to_waitlist(text, text, text, jsonb) TO anon, authenticated;