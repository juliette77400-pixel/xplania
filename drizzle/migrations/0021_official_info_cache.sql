CREATE TABLE public.official_info_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  locale text NOT NULL,
  content jsonb NOT NULL,
  source_dates jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code, locale)
);
GRANT ALL ON public.official_info_cache TO service_role;
ALTER TABLE public.official_info_cache ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.official_info_cache IS 'Summaries of official pages (France Diplomatie, Institut Pasteur) per country and language. Written and read only by the official-sources function.';