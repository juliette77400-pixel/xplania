CREATE TABLE public.culture_guide_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  pillar text NOT NULL,
  locale text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code, pillar, locale)
);
GRANT SELECT ON public.culture_guide_cache TO authenticated;
GRANT ALL ON public.culture_guide_cache TO service_role;
ALTER TABLE public.culture_guide_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read culture cache" ON public.culture_guide_cache FOR SELECT TO authenticated USING (true);