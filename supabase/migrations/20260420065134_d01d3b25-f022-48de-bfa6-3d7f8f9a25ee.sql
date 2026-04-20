-- ============================================
-- Suivi de Voyage : tables + RLS
-- ============================================

-- 1. trip_tracking
CREATE TABLE public.trip_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL UNIQUE REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  share_enabled BOOLEAN NOT NULL DEFAULT false,
  share_slug TEXT UNIQUE,
  last_lat DOUBLE PRECISION,
  last_lng DOUBLE PRECISION,
  last_position_at TIMESTAMPTZ,
  total_distance_km NUMERIC(10,3) NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{"precision":"balanced","notifications":true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tracking" ON public.trip_tracking
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can view shared tracking" ON public.trip_tracking
  FOR SELECT USING (share_enabled = true);
CREATE POLICY "Users insert own tracking" ON public.trip_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own tracking" ON public.trip_tracking
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own tracking" ON public.trip_tracking
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_trip_tracking_updated
  BEFORE UPDATE ON public.trip_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. trip_positions
CREATE TABLE public.trip_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy NUMERIC,
  speed NUMERIC,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_positions_trip ON public.trip_positions(trip_id, recorded_at);

ALTER TABLE public.trip_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own positions" ON public.trip_positions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public view shared positions" ON public.trip_positions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.trip_tracking t
    WHERE t.trip_id = trip_positions.trip_id AND t.share_enabled = true
  ));
CREATE POLICY "Users insert own positions" ON public.trip_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own positions" ON public.trip_positions
  FOR DELETE USING (auth.uid() = user_id);

-- 3. trip_activities
CREATE TABLE public.trip_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  day_date DATE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'todo',
  completed_at TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_activities_trip ON public.trip_activities(trip_id, day_date, position);

ALTER TABLE public.trip_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own activities" ON public.trip_activities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public view shared activities" ON public.trip_activities
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.trip_tracking t
    WHERE t.trip_id = trip_activities.trip_id AND t.share_enabled = true
  ));
CREATE POLICY "Users insert own activities" ON public.trip_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own activities" ON public.trip_activities
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own activities" ON public.trip_activities
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_trip_activities_updated
  BEFORE UPDATE ON public.trip_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. trip_checkins
CREATE TABLE public.trip_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.trip_activities(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  distance_m NUMERIC,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_checkins_trip ON public.trip_checkins(trip_id, checked_at);

ALTER TABLE public.trip_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own checkins" ON public.trip_checkins
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public view shared checkins" ON public.trip_checkins
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.trip_tracking t
    WHERE t.trip_id = trip_checkins.trip_id AND t.share_enabled = true
  ));
CREATE POLICY "Users insert own checkins" ON public.trip_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own checkins" ON public.trip_checkins
  FOR DELETE USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_activities;