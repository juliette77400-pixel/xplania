
-- 1) Admin audit log table
CREATE TABLE public.gam_admin_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_data JSONB,
  after_data JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gam_admin_audit TO authenticated;
GRANT ALL ON public.gam_admin_audit TO service_role;

ALTER TABLE public.gam_admin_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit"
  ON public.gam_admin_audit FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_gam_admin_audit_created ON public.gam_admin_audit (created_at DESC);
CREATE INDEX idx_gam_admin_audit_entity ON public.gam_admin_audit (entity_type, entity_id);

-- 2) Trigger: audit gam_verification_settings updates
CREATE OR REPLACE FUNCTION public.audit_gam_verification_settings()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.gam_admin_audit (actor_id, action, entity_type, entity_id, before_data, after_data)
  VALUES (auth.uid(), 'update_settings', 'gam_verification_settings', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_gam_verification_settings ON public.gam_verification_settings;
CREATE TRIGGER trg_audit_gam_verification_settings
AFTER UPDATE ON public.gam_verification_settings
FOR EACH ROW EXECUTE FUNCTION public.audit_gam_verification_settings();

-- 3) Trigger: audit manual claim decisions + notify owner on status change
CREATE OR REPLACE FUNCTION public.on_gam_claim_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_badge_name TEXT;
  v_title TEXT;
  v_body TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT name_fr INTO v_badge_name FROM public.gam_badges WHERE id = NEW.badge_id;

    -- Audit manual decisions (when reviewed_by present and status final)
    IF NEW.reviewed_by IS NOT NULL AND NEW.status IN ('validated','rejected') THEN
      INSERT INTO public.gam_admin_audit (actor_id, action, entity_type, entity_id, before_data, after_data, metadata)
      VALUES (
        NEW.reviewed_by,
        'manual_decision_' || NEW.status,
        'gam_badge_claim',
        NEW.id::text,
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status, 'review_reason', NEW.review_reason),
        jsonb_build_object('badge_id', NEW.badge_id, 'user_id', NEW.user_id)
      );
    END IF;

    -- Notify the claim owner if transitioning into validated/rejected
    IF NEW.status IN ('validated','rejected') AND OLD.status <> NEW.status THEN
      IF NEW.status = 'validated' THEN
        v_title := 'Badge validé ✓';
        v_body := COALESCE(v_badge_name, 'Ton badge') || ' a été validé.';
      ELSE
        v_title := 'Réclamation rejetée';
        v_body := COALESCE(v_badge_name, 'Ta réclamation') || ' a été rejetée.' ||
                  CASE WHEN NEW.review_reason IS NOT NULL AND NEW.review_reason <> '' THEN ' Motif : ' || NEW.review_reason ELSE '' END;
      END IF;

      INSERT INTO public.discover_notifications (user_id, title, body, type)
      VALUES (NEW.user_id, v_title, v_body, 'gam_claim_' || NEW.status);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gam_claim_status_change ON public.gam_badge_claims;
CREATE TRIGGER trg_gam_claim_status_change
AFTER UPDATE ON public.gam_badge_claims
FOR EACH ROW EXECUTE FUNCTION public.on_gam_claim_status_change();
