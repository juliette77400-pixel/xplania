-- Privacy-friendly first-party analytics events table.
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id text NOT NULL CHECK (length(session_id) <= 64),
  user_id uuid NULL,
  event text NOT NULL CHECK (event IN (
    'page_view','signup_started','signup_completed','login','quiz_started',
    'quiz_completed','trip_created','itinerary_generated','guide_generated',
    'carnet_created','waitlist_joined','cta_click'
  )),
  path text CHECK (length(path) <= 300),
  props jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(props) < 2000),
  lang text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device text
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events (created_at);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;

CREATE POLICY "Anyone can insert their own analytics events"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Admins can read analytics events"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
