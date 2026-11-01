-- v2 of the protected school statistics: same rules, no temporary table (function stays read-only).
CREATE OR REPLACE FUNCTION public.admin_school_stats(_school_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _domain text;
  _k constant integer := 5;
  _students integer;
  _ids uuid[];
  _result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT email_domain INTO _domain FROM public.schools WHERE id = _school_id;
  IF _domain IS NULL THEN RETURN NULL; END IF;

  SELECT coalesce(array_agg(id), '{}') INTO _ids FROM auth.users
    WHERE lower(split_part(email, '@', 2)) = _domain
       OR lower(split_part(email, '@', 2)) LIKE '%.' || _domain;
  _students := coalesce(array_length(_ids, 1), 0);

  IF _students < _k THEN
    RETURN jsonb_build_object('suppressed', true, 'min_group', _k);
  END IF;

  WITH r AS (
    SELECT
      (SELECT count(DISTINCT e.user_id) FROM public.analytics_events e WHERE e.user_id = ANY(_ids) AND e.created_at > now() - interval '30 days') AS active30,
      (SELECT count(*) FROM public.traveler_profiles p WHERE p.user_id = ANY(_ids) AND p.completed_at IS NOT NULL) AS quiz_done,
      (SELECT count(*) FROM public.trips t WHERE t.user_id = ANY(_ids)) AS trips,
      (SELECT count(*) FROM public.satisfaction_surveys s WHERE s.user_id = ANY(_ids)) AS surveys,
      (SELECT avg(s.nps) FROM public.satisfaction_surveys s WHERE s.user_id = ANY(_ids)) AS nps,
      (SELECT avg(s.ease) FROM public.satisfaction_surveys s WHERE s.user_id = ANY(_ids)) AS ease
  ),
  tools AS (
    SELECT c.tool::text AS tool, sum(c.count) AS n, count(DISTINCT c.user_id) AS people
    FROM public.usage_counters c WHERE c.user_id = ANY(_ids)
    GROUP BY c.tool
  ),
  dest AS (
    SELECT initcap(trim(t.destination)) AS d, count(DISTINCT t.user_id) AS people
    FROM public.trips t
    WHERE t.user_id = ANY(_ids) AND t.destination IS NOT NULL AND trim(t.destination) <> ''
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    'suppressed', false,
    'min_group', _k,
    'rounded_to', _k,
    'students', (round(_students / 5.0) * 5)::int,
    'active30', CASE WHEN r.active30 < _k THEN NULL ELSE (round(r.active30 / 5.0) * 5)::int END,
    'quiz_done', CASE WHEN r.quiz_done < _k THEN NULL ELSE (round(r.quiz_done / 5.0) * 5)::int END,
    'trips', CASE WHEN r.trips < _k THEN NULL ELSE (round(r.trips / 5.0) * 5)::int END,
    'surveys', CASE WHEN r.surveys < _k THEN NULL ELSE (round(r.surveys / 5.0) * 5)::int END,
    'nps_avg', CASE WHEN r.surveys < _k THEN NULL ELSE round(r.nps * 2) / 2 END,
    'ease_avg', CASE WHEN r.surveys < _k THEN NULL ELSE round(r.ease * 2) / 2 END,
    'tools', COALESCE((SELECT jsonb_object_agg(tool, (round(n / 5.0) * 5)::int) FROM tools WHERE people >= _k), '{}'::jsonb),
    'destinations', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', d, 'count', (round(people / 5.0) * 5)::int) ORDER BY people DESC) FROM (SELECT * FROM dest WHERE people >= _k ORDER BY people DESC LIMIT 8) y), '[]'::jsonb),
    'other_destinations', (SELECT CASE WHEN coalesce(sum(people), 0) < _k THEN NULL ELSE (round(sum(people) / 5.0) * 5)::int END FROM dest WHERE people < _k)
  ) INTO _result
  FROM r;

  RETURN _result;
END $function$;

REVOKE ALL ON FUNCTION public.admin_school_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_school_stats(uuid) TO authenticated, service_role;