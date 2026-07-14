-- ============================================================
-- Bloc A — Renforcement SECURITY DEFINER
-- Retire les EXECUTE inutiles pour réduire la surface d'attaque.
-- ============================================================

-- 1) Fonctions authentifiées uniquement : bloquer anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.owns_place_list(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.gam_user_points(uuid) FROM anon;

-- 2) Fonctions déclencheurs (triggers) : jamais appelées via l'API PostgREST
--    Les triggers continueront de fonctionner car ils s'exécutent côté serveur.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalc_explore_progress() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalc_explore_progress_from_badge() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalc_place_rating() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalc_place_rating_combined() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalc_node_media_count() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_verification_settings() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_claim_decision() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_gam_verification_settings() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_gam_notification_settings() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_gam_claim_status_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.normalize_premium_waitlist_email() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_grant_admin_juliette() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;

-- 3) Fonctions publiques : on s'assure que anon a bien EXECUTE (idempotent)
--    Ces fonctions sont volontairement exposées (partage de carnet, waitlist, avis publics).
GRANT EXECUTE ON FUNCTION public.get_public_trip_activities(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_trip_positions(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_trip_tracking(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_place_ratings_public(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_display_name(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_waitlist_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_to_waitlist(text, text, text, jsonb) TO anon, authenticated;
