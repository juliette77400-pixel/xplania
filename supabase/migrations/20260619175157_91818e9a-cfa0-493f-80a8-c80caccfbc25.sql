
-- 1) Restrict SELECT on admin-only config tables
DROP POLICY IF EXISTS "Authenticated read notif settings" ON public.gam_notification_settings;
CREATE POLICY "Admins read notif settings"
  ON public.gam_notification_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone signed-in can read settings" ON public.gam_verification_settings;
CREATE POLICY "Admins read verification settings"
  ON public.gam_verification_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Revoke EXECUTE from anon/authenticated on internal trigger & admin SECURITY DEFINER functions.
--    These run via triggers as table owner; clients should never call them directly.
REVOKE EXECUTE ON FUNCTION public.audit_gam_notification_settings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_gam_verification_settings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_grant_admin_juliette() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_claim_decision() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_verification_settings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_gam_claim_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_explore_progress() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_explore_progress_from_badge() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_node_media_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_place_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_premium_waitlist_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
