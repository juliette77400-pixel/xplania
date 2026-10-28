CREATE TABLE public.link_checks (
  url text PRIMARY KEY,
  outcome text NOT NULL DEFAULT 'pending' CHECK (outcome IN ('ok', 'moved', 'broken', 'blocked', 'error', 'pending')),
  http_status integer,
  final_url text,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  consecutive_failures integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.link_checks TO anon, authenticated;
GRANT ALL ON public.link_checks TO service_role;

ALTER TABLE public.link_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Link check results are public"
  ON public.link_checks FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON TABLE public.link_checks IS 'Daily automatic reachability check of hand-picked external links (written only by the link-check function).';