-- School statistics are aggregated and protected against identification:
-- nothing below 5 students is returned, every count is rounded to the nearest 5,
-- averages need 5 answers, rare destinations are merged, journals are no longer exposed.
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
  _result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT email_domain INTO _domain FROM public.schools WHERE id = _school_id;
  IF _domain IS NULL THEN RETURN NULL; END IF;

  CREATE TEMP TABLE IF NOT EXISTS _school_users (id uuid PRIMARY KEY) ON COMMIT DROP;
  TRUNCATE _school_users;
  INSERT INTO _school_users
    SELECT id FROM auth.users
    WHERE lower(split_part(email, '@', 2)) = _domain
       OR lower(split_part(email, '@', 2)) LIKE '%.' || _domain;
  SELECT count(*) INTO _students FROM _school_users;

  IF _students < _k THEN
    RETURN jsonb_build_object('suppressed', true, 'min_group', _k);
  END IF;

  WITH r AS (
    SELECT
      (SELECT count(DISTINCT e.user_id) FROM public.analytics_events e JOIN _school_users u ON u.id = e.user_id WHERE e.created_at > now() - interval '30 days') AS active30,
      (SELECT count(*) FROM public.traveler_profiles p JOIN _school_users u ON u.id = p.user_id WHERE p.completed_at IS NOT NULL) AS quiz_done,
      (SELECT count(*) FROM public.trips t JOIN _school_users u ON u.id = t.user_id) AS trips,
      (SELECT count(*) FROM public.satisfaction_surveys s JOIN _school_users u ON u.id = s.user_id) AS surveys,
      (SELECT avg(s.nps) FROM public.satisfaction_surveys s JOIN _school_users u ON u.id = s.user_id) AS nps,
      (SELECT avg(s.ease) FROM public.satisfaction_surveys s JOIN _school_users u ON u.id = s.user_id) AS ease
  ),
  tools AS (
    SELECT c.tool::text AS tool, sum(c.count) AS n, count(DISTINCT c.user_id) AS people
    FROM public.usage_counters c JOIN _school_users u ON u.id = c.user_id
    GROUP BY c.tool
  ),
  dest AS (
    SELECT initcap(trim(t.destination)) AS d, count(DISTINCT t.user_id) AS people
    FROM public.trips t JOIN _school_users u ON u.id = t.user_id
    WHERE t.destination IS NOT NULL AND trim(t.destination) <> ''
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