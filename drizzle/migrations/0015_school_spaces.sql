CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  email_domain text NOT NULL UNIQUE CHECK (email_domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage schools" ON public.schools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_school_stats(_school_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE _domain text; _result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT email_domain INTO _domain FROM public.schools WHERE id = _school_id;
  IF _domain IS NULL THEN RETURN NULL; END IF;
  WITH u AS (
    SELECT id FROM auth.users
    WHERE lower(split_part(email, '@', 2)) = _domain
       OR lower(split_part(email, '@', 2)) LIKE '%.' || _domain
  )
  SELECT jsonb_build_object(
    'students', (SELECT count(*) FROM u),
    'active30', (SELECT count(DISTINCT e.user_id) FROM public.analytics_events e JOIN u ON u.id = e.user_id WHERE e.created_at > now() - interval '30 days'),
    'quiz_done', (SELECT count(*) FROM public.traveler_profiles p JOIN u ON u.id = p.user_id WHERE p.completed_at IS NOT NULL),
    'trips', (SELECT count(*) FROM public.trips t JOIN u ON u.id = t.user_id),
    'journals', (SELECT count(*) FROM public.journals j JOIN u ON u.id = j.user_id),
    'tools', COALESCE((SELECT jsonb_object_agg(tool, n) FROM (SELECT c.tool::text AS tool, sum(c.count) AS n FROM public.usage_counters c JOIN u ON u.id = c.user_id GROUP BY c.tool) x), '{}'::jsonb),
    'destinations', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', d, 'count', n) ORDER BY n DESC) FROM (SELECT initcap(trim(t.destination)) AS d, count(*) AS n FROM public.trips t JOIN u ON u.id = t.user_id WHERE t.destination IS NOT NULL AND trim(t.destination) <> '' GROUP BY 1 ORDER BY 2 DESC LIMIT 8) y), '[]'::jsonb),
    'surveys', (SELECT count(*) FROM public.satisfaction_surveys s JOIN u ON u.id = s.user_id),
    'nps_avg', (SELECT round(avg(s.nps)::numeric, 1) FROM public.satisfaction_surveys s JOIN u ON u.id = s.user_id),
    'ease_avg', (SELECT round(avg(s.ease)::numeric, 1) FROM public.satisfaction_surveys s JOIN u ON u.id = s.user_id)
  ) INTO _result;
  RETURN _result;
END $$;
REVOKE ALL ON FUNCTION public.admin_school_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_school_stats(uuid) TO authenticated;