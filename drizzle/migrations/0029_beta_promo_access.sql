CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE private.promo_codes (
  code text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.promo_codes FROM PUBLIC, anon, authenticated;
INSERT INTO private.promo_codes (code, expires_at) VALUES ('ESTICE', '2026-12-13 00:00:00+01');

CREATE TABLE public.beta_access (
  user_id uuid PRIMARY KEY,
  code text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
GRANT SELECT ON public.beta_access TO authenticated;
GRANT ALL ON public.beta_access TO service_role;
ALTER TABLE public.beta_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own beta access" ON public.beta_access FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read beta access" ON public.beta_access FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.has_beta_access(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.beta_access WHERE user_id = _user AND expires_at > now())
$$;

CREATE OR REPLACE FUNCTION public.redeem_promo_code(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row private.promo_codes%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated'); END IF;
  SELECT * INTO v_row FROM private.promo_codes WHERE code = upper(btrim(coalesce(_code, '')));
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid'); END IF;
  IF v_row.expires_at <= now() THEN RETURN jsonb_build_object('ok', false, 'reason', 'expired'); END IF;
  INSERT INTO public.beta_access (user_id, code, expires_at) VALUES (v_user, v_row.code, v_row.expires_at)
  ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, granted_at = now();
  RETURN jsonb_build_object('ok', true, 'expires_at', v_row.expires_at);
END $$;
REVOKE ALL ON FUNCTION public.redeem_promo_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.consume_quota(_tool quota_tool)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_limit int;
  v_period date := date_trunc('month', now())::date;
  v_new int;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  END IF;
  IF public.has_role(v_user, 'admin'::app_role) THEN
    RETURN jsonb_build_object('allowed', true, 'admin', true, 'used', 0, 'limit', -1);
  END IF;
  IF public.has_beta_access(v_user) THEN
    RETURN jsonb_build_object('allowed', true, 'admin', false, 'beta', true, 'used', 0, 'limit', -1);
  END IF;
  v_limit := public.get_quota_limit(_tool);
  INSERT INTO public.usage_counters (user_id, tool, period_month, count)
  VALUES (v_user, _tool, v_period, 1)
  ON CONFLICT (user_id, tool, period_month) DO UPDATE
    SET count = usage_counters.count + 1, updated_at = now()
  RETURNING count INTO v_new;
  IF v_new > v_limit THEN
    UPDATE public.usage_counters SET count = count - 1
      WHERE user_id = v_user AND tool = _tool AND period_month = v_period;
    RETURN jsonb_build_object('allowed', false, 'reason', 'quota_exceeded', 'used', v_new - 1, 'limit', v_limit);
  END IF;
  RETURN jsonb_build_object('allowed', true, 'used', v_new, 'limit', v_limit);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_quota_status(_tool quota_tool)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_used int;
  v_period date := date_trunc('month', now())::date;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('used', 0, 'limit', 0, 'admin', false, 'anon', true);
  END IF;
  IF public.has_role(v_user, 'admin'::app_role) THEN
    RETURN jsonb_build_object('used', 0, 'limit', -1, 'admin', true);
  END IF;
  IF public.has_beta_access(v_user) THEN
    RETURN jsonb_build_object('used', 0, 'limit', -1, 'admin', false, 'beta', true);
  END IF;
  SELECT count INTO v_used FROM public.usage_counters
    WHERE user_id = v_user AND tool = _tool AND period_month = v_period;
  RETURN jsonb_build_object('used', COALESCE(v_used, 0), 'limit', public.get_quota_limit(_tool), 'admin', false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_quota_status()
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_admin boolean;
  v_beta boolean;
  v_row record;
  v_out jsonb := '{}'::jsonb;
  v_tool public.quota_tool;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('anon', true);
  END IF;
  v_admin := public.has_role(v_user, 'admin'::app_role);
  v_beta := public.has_beta_access(v_user);
  FOR v_tool IN SELECT unnest(enum_range(NULL::public.quota_tool)) LOOP
    IF v_admin OR v_beta THEN
      v_out := v_out || jsonb_build_object(v_tool::text, jsonb_build_object('used', 0, 'limit', -1, 'admin', v_admin, 'beta', v_beta AND NOT v_admin));
    ELSE
      SELECT count INTO v_row FROM public.usage_counters
        WHERE user_id = v_user AND tool = v_tool AND period_month = date_trunc('month', now())::date;
      v_out := v_out || jsonb_build_object(v_tool::text,
        jsonb_build_object('used', COALESCE(v_row.count, 0), 'limit', public.get_quota_limit(v_tool), 'admin', false));
    END IF;
  END LOOP;
  RETURN v_out;
END;
$function$;