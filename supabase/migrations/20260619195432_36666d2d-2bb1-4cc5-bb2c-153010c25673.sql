
-- Lock down SECURITY DEFINER helper functions: revoke EXECUTE from PUBLIC/anon/authenticated,
-- then re-grant only on functions intentionally exposed as RPCs.

-- Trigger / internal helper functions: not meant to be called via the Data API
REVOKE EXECUTE ON FUNCTION public.owns_place_list(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_explore_progress_from_badge() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_gam_verification_settings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_verification_settings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_gam_notification_settings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_claim_decision() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_premium_waitlist_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_gam_claim_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_explore_progress() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_display_name(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_place_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_node_media_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_grant_admin_juliette() FROM PUBLIC, anon, authenticated;

-- Public RPCs intentionally exposed: revoke from PUBLIC then grant to the right roles
REVOKE EXECUTE ON FUNCTION public.get_waitlist_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_waitlist_count() TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.subscribe_to_waitlist(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_to_waitlist(text, text, text, jsonb) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_trip_tracking(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_trip_tracking(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_trip_activities(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_trip_activities(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_trip_positions(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_trip_positions(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.gam_user_points(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gam_user_points(uuid) TO authenticated;
