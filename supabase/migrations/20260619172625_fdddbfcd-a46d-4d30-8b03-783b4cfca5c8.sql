
CREATE TABLE public.gam_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  claim_id UUID,
  badge_id UUID,
  transition TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gam_notification_log TO authenticated;
GRANT ALL ON public.gam_notification_log TO service_role;

ALTER TABLE public.gam_notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all notif logs" ON public.gam_notification_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read own notif logs" ON public.gam_notification_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_gam_notification_log_created_at ON public.gam_notification_log (created_at DESC);
CREATE INDEX idx_gam_notification_log_user ON public.gam_notification_log (user_id, created_at DESC);

-- Update trigger to log every notification attempt
CREATE OR REPLACE FUNCTION public.on_gam_claim_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_badge_name TEXT;
  v_title TEXT;
  v_body TEXT;
  v_cfg RECORD;
  v_enabled BOOLEAN;
  v_transition TEXT;
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
      v_transition := COALESCE(OLD.status, 'unknown') || '->' || NEW.status;
      SELECT * INTO v_cfg FROM public.gam_notification_settings WHERE id = 'default';

      v_enabled := CASE
        WHEN NEW.status = 'validated' THEN COALESCE(v_cfg.enabled_validated, true)
        ELSE COALESCE(v_cfg.enabled_rejected, true)
      END;

      IF NEW.status = 'validated' THEN
        v_title := 'Badge validé ✓';
        v_body := COALESCE(v_badge_name, 'Ton badge') || ' a été validé.';
      ELSE
        v_title := 'Réclamation rejetée';
        v_body := COALESCE(v_badge_name, 'Ta réclamation') || ' a été rejetée.' ||
                  CASE WHEN NEW.review_reason IS NOT NULL AND NEW.review_reason <> '' THEN ' Motif : ' || NEW.review_reason ELSE '' END;
      END IF;

      -- In-app
      IF v_enabled AND COALESCE(v_cfg.channel_in_app, true) THEN
        INSERT INTO public.discover_notifications (user_id, title, body, type)
        VALUES (NEW.user_id, v_title, v_body, 'gam_claim_' || NEW.status);

        INSERT INTO public.gam_notification_log (user_id, claim_id, badge_id, transition, channel, status, payload)
        VALUES (NEW.user_id, NEW.id, NEW.badge_id, v_transition, 'in_app', 'sent',
                jsonb_build_object('title', v_title, 'body', v_body));
      ELSE
        INSERT INTO public.gam_notification_log (user_id, claim_id, badge_id, transition, channel, status, payload)
        VALUES (NEW.user_id, NEW.id, NEW.badge_id, v_transition, 'in_app', 'skipped',
                jsonb_build_object('reason', CASE WHEN NOT v_enabled THEN 'disabled' ELSE 'channel_off' END));
      END IF;

      -- Email (queued / not implemented)
      IF v_enabled AND COALESCE(v_cfg.channel_email, false) THEN
        INSERT INTO public.gam_notification_log (user_id, claim_id, badge_id, transition, channel, status, payload)
        VALUES (NEW.user_id, NEW.id, NEW.badge_id, v_transition, 'email', 'queued',
                jsonb_build_object('title', v_title, 'body', v_body));
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
