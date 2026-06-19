
-- 1) Notification settings (single 'default' row)
CREATE TABLE public.gam_notification_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enabled_validated BOOLEAN NOT NULL DEFAULT true,
  enabled_rejected BOOLEAN NOT NULL DEFAULT true,
  channel_in_app BOOLEAN NOT NULL DEFAULT true,
  channel_email BOOLEAN NOT NULL DEFAULT false,
  frequency TEXT NOT NULL DEFAULT 'instant' CHECK (frequency IN ('instant','daily')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gam_notification_settings TO authenticated;
GRANT ALL ON public.gam_notification_settings TO service_role;

ALTER TABLE public.gam_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read notif settings"
  ON public.gam_notification_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins manage notif settings"
  ON public.gam_notification_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_gam_notification_settings_updated
BEFORE UPDATE ON public.gam_notification_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.gam_notification_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;

-- Audit changes to gam_notification_settings via the existing pattern
CREATE OR REPLACE FUNCTION public.audit_gam_notification_settings()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.gam_admin_audit (actor_id, action, entity_type, entity_id, before_data, after_data)
  VALUES (auth.uid(), 'update_notif_settings', 'gam_notification_settings', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_gam_notification_settings ON public.gam_notification_settings;
CREATE TRIGGER trg_audit_gam_notification_settings
AFTER UPDATE ON public.gam_notification_settings
FOR EACH ROW EXECUTE FUNCTION public.audit_gam_notification_settings();

-- 2) Update claim status trigger to honour notification settings
CREATE OR REPLACE FUNCTION public.on_gam_claim_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_badge_name TEXT;
  v_title TEXT;
  v_body TEXT;
  v_cfg RECORD;
  v_enabled BOOLEAN;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT name_fr INTO v_badge_name FROM public.gam_badges WHERE id = NEW.badge_id;

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

    IF NEW.status IN ('validated','rejected') AND OLD.status <> NEW.status THEN
      SELECT * INTO v_cfg FROM public.gam_notification_settings WHERE id = 'default';

      v_enabled := CASE
        WHEN NEW.status = 'validated' THEN COALESCE(v_cfg.enabled_validated, true)
        ELSE COALESCE(v_cfg.enabled_rejected, true)
      END;

      IF v_enabled AND COALESCE(v_cfg.channel_in_app, true) THEN
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
      -- email channel: queued for future delivery; kept as a no-op for now
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Defense-in-depth: BEFORE triggers enforcing admin-only mutations
CREATE OR REPLACE FUNCTION public.enforce_admin_claim_decision()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('validated','rejected')
     AND OLD.status NOT IN ('validated','rejected')
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: only admins can validate or reject a claim';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_admin_claim_decision ON public.gam_badge_claims;
CREATE TRIGGER trg_enforce_admin_claim_decision
BEFORE UPDATE ON public.gam_badge_claims
FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_claim_decision();

CREATE OR REPLACE FUNCTION public.enforce_admin_verification_settings()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: only admins can modify verification settings';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_admin_verif_settings_ud ON public.gam_verification_settings;
CREATE TRIGGER trg_enforce_admin_verif_settings_ud
BEFORE INSERT OR UPDATE OR DELETE ON public.gam_verification_settings
FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_verification_settings();

DROP TRIGGER IF EXISTS trg_enforce_admin_notif_settings_ud ON public.gam_notification_settings;
CREATE TRIGGER trg_enforce_admin_notif_settings_ud
BEFORE INSERT OR UPDATE OR DELETE ON public.gam_notification_settings
FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_verification_settings();
