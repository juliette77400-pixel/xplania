
-- Trip alerts table
CREATE TABLE public.trip_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('weather','climate','security','events','activities','transport')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT,
  source_url TEXT,
  link TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_alerts TO authenticated;
GRANT ALL ON public.trip_alerts TO service_role;

ALTER TABLE public.trip_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own trip alerts"
ON public.trip_alerts FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_trip_alerts_trip_user ON public.trip_alerts(trip_id, user_id, dismissed, created_at DESC);

-- Alert subscriptions (email + in-app only; SMS skipped per user choice)
CREATE TABLE public.alert_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app']::text[],
  categories TEXT[] NOT NULL DEFAULT ARRAY['weather','security','events']::text[],
  email TEXT,
  min_severity TEXT NOT NULL DEFAULT 'warning' CHECK (min_severity IN ('info','warning','critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, trip_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_subscriptions TO authenticated;
GRANT ALL ON public.alert_subscriptions TO service_role;

ALTER TABLE public.alert_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own alert subscriptions"
ON public.alert_subscriptions FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_alert_subs_updated
BEFORE UPDATE ON public.alert_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.trip_alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_alerts;
