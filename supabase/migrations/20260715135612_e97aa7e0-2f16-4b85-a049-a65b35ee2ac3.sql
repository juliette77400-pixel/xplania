
-- Tool enum
DO $$ BEGIN
  CREATE TYPE public.quota_tool AS ENUM ('valise','budget','visa','discover','mood','explore','carnet','suivi');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Usage counters
CREATE TABLE IF NOT EXISTS public.usage_counters (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool public.quota_tool NOT NULL,
  period_month date NOT NULL DEFAULT date_trunc('month', now())::date,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tool, period_month)
);

GRANT SELECT ON public.usage_counters TO authenticated;
GRANT ALL ON public.usage_counters TO service_role;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage_counters;
CREATE POLICY "Users can view their own usage"
  ON public.usage_counters
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Explicit block: no client writes. Only the SECURITY DEFINER RPC mutates.
DROP POLICY IF EXISTS "No client writes on usage_counters" ON public.usage_counters;
CREATE POLICY "No client writes on usage_counters"
  ON public.usage_counters FOR ALL
  TO authenticated, anon
  USING (false) WITH CHECK (false);

-- Quiz completions
CREATE TABLE IF NOT EXISTS public.quiz_completions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 1
);

GRANT SELECT ON public.quiz_completions TO authenticated;
GRANT ALL ON public.quiz_completions TO service_role;
ALTER TABLE public.quiz_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own quiz status" ON public.quiz_completions;
CREATE POLICY "Users can view their own quiz status"
  ON public.quiz_completions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "No client writes on quiz_completions" ON public.quiz_completions;
CREATE POLICY "No client writes on quiz_completions"
  ON public.quiz_completions FOR ALL
  TO authenticated, anon
  USING (false) WITH CHECK (false);

-- Quota limits (source of truth server-side)
CREATE OR REPLACE FUNCTION public.get_quota_limit(_tool public.quota_tool)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _tool
    WHEN 'valise'   THEN 3
    WHEN 'budget'   THEN 3
    WHEN 'visa'     THEN 3
    WHEN 'mood'     THEN 3
    WHEN 'discover' THEN 1
    WHEN 'explore'  THEN 1
    WHEN 'carnet'   THEN 1
    WHEN 'suivi'    THEN 1
  END;
$$;

-- Atomic consume: increments the counter and returns whether it was allowed.
CREATE OR REPLACE FUNCTION public.consume_quota(_tool public.quota_tool)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
  v_limit := public.get_quota_limit(_tool);

  INSERT INTO public.usage_counters (user_id, tool, period_month, count)
  VALUES (v_user, _tool, v_period, 1)
  ON CONFLICT (user_id, tool, period_month) DO UPDATE
    SET count = usage_counters.count + 1, updated_at = now()
  RETURNING count INTO v_new;

  IF v_new > v_limit THEN
    -- Undo the increment we just wrote so the counter reflects true consumption.
    UPDATE public.usage_counters
      SET count = count - 1
      WHERE user_id = v_user AND tool = _tool AND period_month = v_period;
    RETURN jsonb_build_object('allowed', false, 'reason', 'quota_exceeded', 'used', v_new - 1, 'limit', v_limit);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'used', v_new, 'limit', v_limit);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_quota_status(_tool public.quota_tool)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_used int;
  v_limit int;
  v_period date := date_trunc('month', now())::date;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('used', 0, 'limit', 0, 'admin', false, 'anon', true);
  END IF;
  IF public.has_role(v_user, 'admin'::app_role) THEN
    RETURN jsonb_build_object('used', 0, 'limit', -1, 'admin', true);
  END IF;
  v_limit := public.get_quota_limit(_tool);
  SELECT count INTO v_used FROM public.usage_counters
    WHERE user_id = v_user AND tool = _tool AND period_month = v_period;
  RETURN jsonb_build_object('used', COALESCE(v_used, 0), 'limit', v_limit, 'admin', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_quota_status()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_admin boolean;
  v_row record;
  v_out jsonb := '{}'::jsonb;
  v_tool public.quota_tool;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('anon', true);
  END IF;
  v_admin := public.has_role(v_user, 'admin'::app_role);
  FOR v_tool IN SELECT unnest(enum_range(NULL::public.quota_tool)) LOOP
    IF v_admin THEN
      v_out := v_out || jsonb_build_object(v_tool::text, jsonb_build_object('used', 0, 'limit', -1, 'admin', true));
    ELSE
      SELECT count INTO v_row FROM public.usage_counters
        WHERE user_id = v_user AND tool = v_tool
          AND period_month = date_trunc('month', now())::date;
      v_out := v_out || jsonb_build_object(
        v_tool::text,
        jsonb_build_object('used', COALESCE(v_row.count, 0), 'limit', public.get_quota_limit(v_tool), 'admin', false)
      );
    END IF;
  END LOOP;
  RETURN v_out;
END;
$$;

-- Quiz retake gate
CREATE OR REPLACE FUNCTION public.can_retake_quiz()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_count int;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  END IF;
  IF public.has_role(v_user, 'admin'::app_role) THEN
    RETURN jsonb_build_object('allowed', true, 'admin', true);
  END IF;
  SELECT count INTO v_count FROM public.quiz_completions WHERE user_id = v_user;
  IF v_count IS NULL OR v_count = 0 THEN
    RETURN jsonb_build_object('allowed', true, 'first', true);
  END IF;
  RETURN jsonb_build_object('allowed', false, 'reason', 'quiz_already_completed');
END;
$$;

CREATE OR REPLACE FUNCTION public.record_quiz_completion()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated'); END IF;
  INSERT INTO public.quiz_completions (user_id, count) VALUES (v_user, 1)
  ON CONFLICT (user_id) DO UPDATE
    SET count = quiz_completions.count + 1, completed_at = now();
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Grants: revoke public, expose only to authenticated
REVOKE ALL ON FUNCTION public.consume_quota(public.quota_tool) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_quota(public.quota_tool) TO authenticated;
REVOKE ALL ON FUNCTION public.get_quota_status(public.quota_tool) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quota_status(public.quota_tool) TO authenticated;
REVOKE ALL ON FUNCTION public.get_all_quota_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_quota_status() TO authenticated;
REVOKE ALL ON FUNCTION public.can_retake_quiz() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_retake_quiz() TO authenticated;
REVOKE ALL ON FUNCTION public.record_quiz_completion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_quiz_completion() TO authenticated;
REVOKE ALL ON FUNCTION public.get_quota_limit(public.quota_tool) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quota_limit(public.quota_tool) TO authenticated, service_role;
