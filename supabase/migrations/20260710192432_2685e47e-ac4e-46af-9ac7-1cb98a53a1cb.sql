
-- Revoke EXECUTE on trigger/internal SECURITY DEFINER functions from anon/authenticated/public.
-- These are only meant to run via triggers or admin/service_role, never called directly.

DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.recalc_explore_progress_from_badge()',
    'public.audit_gam_verification_settings()',
    'public.audit_gam_notification_settings()',
    'public.enforce_admin_claim_decision()',
    'public.enforce_admin_verification_settings()',
    'public.normalize_premium_waitlist_email()',
    'public.update_updated_at_column()',
    'public.on_gam_claim_status_change()',
    'public.recalc_place_rating_combined()',
    'public.recalc_place_rating()',
    'public.recalc_explore_progress()',
    'public.recalc_node_media_count()',
    'public.handle_new_user()',
    'public.auto_grant_admin_juliette()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;
