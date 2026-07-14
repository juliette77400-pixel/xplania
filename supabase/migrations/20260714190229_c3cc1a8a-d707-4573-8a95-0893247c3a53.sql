
-- Anonymous-friendly onboarding events log used for funnel analytics.
CREATE TABLE public.onboarding_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event TEXT NOT NULL,
  step TEXT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX onboarding_events_session_idx ON public.onboarding_events(session_id, created_at);
CREATE INDEX onboarding_events_user_idx ON public.onboarding_events(user_id, created_at);
CREATE INDEX onboarding_events_event_idx ON public.onboarding_events(event, created_at);

GRANT INSERT ON public.onboarding_events TO anon, authenticated;
GRANT SELECT ON public.onboarding_events TO authenticated;
GRANT ALL ON public.onboarding_events TO service_role;

ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;

-- Anyone can log events (anonymous flow); only bind user_id to the auth user when present.
CREATE POLICY "Anyone can insert onboarding events"
  ON public.onboarding_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

-- Only admins can read the funnel; regular users can read their own events.
CREATE POLICY "Users read their own events"
  ON public.onboarding_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
