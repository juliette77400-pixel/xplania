-- =========================================
-- EXPLORE: Travel Map gamifié
-- =========================================

-- 1. NODES (points d'intérêt ramifiés)
CREATE TABLE public.explore_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.explore_nodes(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 2, -- 1=ville, 2=lieu, 3=expérience
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'place', -- city, place, activity, food, hotel, spot, culture, nature, nightlife
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'planned', -- planned, in_progress, visited
  points INTEGER NOT NULL DEFAULT 10,
  media_count INTEGER NOT NULL DEFAULT 0,
  position_x DOUBLE PRECISION,
  position_y DOUBLE PRECISION,
  source TEXT NOT NULL DEFAULT 'manual', -- ai, journal, tracking, manual
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  visited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_explore_nodes_trip ON public.explore_nodes(trip_id);
CREATE INDEX idx_explore_nodes_user ON public.explore_nodes(user_id);
CREATE INDEX idx_explore_nodes_parent ON public.explore_nodes(parent_id);

ALTER TABLE public.explore_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own nodes" ON public.explore_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public view shared nodes" ON public.explore_nodes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trip_tracking t WHERE t.trip_id = explore_nodes.trip_id AND t.share_enabled = true)
);
CREATE POLICY "Users insert own nodes" ON public.explore_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own nodes" ON public.explore_nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own nodes" ON public.explore_nodes FOR DELETE USING (auth.uid() = user_id);

-- 2. EDGES (connexions)
CREATE TABLE public.explore_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  from_node_id UUID NOT NULL REFERENCES public.explore_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES public.explore_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL DEFAULT 'logical', -- geographic, logical, temporal
  weight DOUBLE PRECISION DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_explore_edges_trip ON public.explore_edges(trip_id);
CREATE INDEX idx_explore_edges_from ON public.explore_edges(from_node_id);
CREATE INDEX idx_explore_edges_to ON public.explore_edges(to_node_id);

ALTER TABLE public.explore_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own edges" ON public.explore_edges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public view shared edges" ON public.explore_edges FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trip_tracking t WHERE t.trip_id = explore_edges.trip_id AND t.share_enabled = true)
);
CREATE POLICY "Users insert own edges" ON public.explore_edges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own edges" ON public.explore_edges FOR DELETE USING (auth.uid() = user_id);

-- 3. MEDIA (souvenirs attachés aux nodes)
CREATE TABLE public.explore_node_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID NOT NULL REFERENCES public.explore_nodes(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'photo', -- photo, video, note
  url TEXT,
  caption TEXT,
  mood TEXT, -- happy, peaceful, excited, surprised, tired
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_explore_media_node ON public.explore_node_media(node_id);

ALTER TABLE public.explore_node_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own media" ON public.explore_node_media FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public view shared media" ON public.explore_node_media FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trip_tracking t WHERE t.trip_id = explore_node_media.trip_id AND t.share_enabled = true)
);
CREATE POLICY "Users insert own media" ON public.explore_node_media FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own media" ON public.explore_node_media FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own media" ON public.explore_node_media FOR DELETE USING (auth.uid() = user_id);

-- 4. BADGES débloqués
CREATE TABLE public.explore_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, trip_id, code)
);

CREATE INDEX idx_explore_badges_user ON public.explore_badges(user_id);
CREATE INDEX idx_explore_badges_trip ON public.explore_badges(trip_id);

ALTER TABLE public.explore_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own explore badges" ON public.explore_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public view shared explore badges" ON public.explore_badges FOR SELECT USING (
  trip_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.trip_tracking t WHERE t.trip_id = explore_badges.trip_id AND t.share_enabled = true)
);
CREATE POLICY "Users insert own explore badges" ON public.explore_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own explore badges" ON public.explore_badges FOR DELETE USING (auth.uid() = user_id);

-- 5. PROGRESS (score par voyage)
CREATE TABLE public.explore_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  nodes_visited INTEGER NOT NULL DEFAULT 0,
  nodes_total INTEGER NOT NULL DEFAULT 0,
  cities_completed INTEGER NOT NULL DEFAULT 0,
  badges_count INTEGER NOT NULL DEFAULT 0,
  last_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_explore_progress_user ON public.explore_progress(user_id);

ALTER TABLE public.explore_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own progress" ON public.explore_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public view shared progress" ON public.explore_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trip_tracking t WHERE t.trip_id = explore_progress.trip_id AND t.share_enabled = true)
);
CREATE POLICY "Users insert own progress" ON public.explore_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON public.explore_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own progress" ON public.explore_progress FOR DELETE USING (auth.uid() = user_id);

-- =========================================
-- TRIGGERS
-- =========================================

-- updated_at auto
CREATE TRIGGER trg_explore_nodes_updated BEFORE UPDATE ON public.explore_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_explore_progress_updated BEFORE UPDATE ON public.explore_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recalcul progress quand un node change
CREATE OR REPLACE FUNCTION public.recalc_explore_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip UUID;
  v_user UUID;
  v_total INT;
  v_visited INT;
  v_count INT;
  v_cities INT;
  v_badges INT;
BEGIN
  v_trip := COALESCE(NEW.trip_id, OLD.trip_id);
  v_user := COALESCE(NEW.user_id, OLD.user_id);
  IF v_trip IS NULL OR v_user IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(CASE WHEN status = 'visited' THEN points ELSE points / 5 END), 0),
         COUNT(*) FILTER (WHERE status = 'visited'),
         COUNT(*),
         COUNT(*) FILTER (WHERE level = 1 AND status = 'visited')
    INTO v_total, v_visited, v_count, v_cities
    FROM public.explore_nodes
   WHERE trip_id = v_trip;

  SELECT COUNT(*) INTO v_badges FROM public.explore_badges WHERE trip_id = v_trip AND user_id = v_user;

  INSERT INTO public.explore_progress (user_id, trip_id, total_points, nodes_visited, nodes_total, cities_completed, badges_count, last_action_at)
  VALUES (v_user, v_trip, v_total, v_visited, v_count, v_cities, v_badges, now())
  ON CONFLICT (trip_id) DO UPDATE
    SET total_points = EXCLUDED.total_points,
        nodes_visited = EXCLUDED.nodes_visited,
        nodes_total = EXCLUDED.nodes_total,
        cities_completed = EXCLUDED.cities_completed,
        badges_count = EXCLUDED.badges_count,
        last_action_at = now(),
        updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_explore_nodes_progress
  AFTER INSERT OR UPDATE OR DELETE ON public.explore_nodes
  FOR EACH ROW EXECUTE FUNCTION public.recalc_explore_progress();

CREATE OR REPLACE FUNCTION public.recalc_explore_progress_from_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip UUID;
  v_user UUID;
  v_badges INT;
BEGIN
  v_trip := COALESCE(NEW.trip_id, OLD.trip_id);
  v_user := COALESCE(NEW.user_id, OLD.user_id);
  IF v_trip IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT COUNT(*) INTO v_badges FROM public.explore_badges WHERE trip_id = v_trip AND user_id = v_user;

  UPDATE public.explore_progress SET badges_count = v_badges, updated_at = now() WHERE trip_id = v_trip;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_explore_badges_progress
  AFTER INSERT OR DELETE ON public.explore_badges
  FOR EACH ROW EXECUTE FUNCTION public.recalc_explore_progress_from_badge();

-- Update media_count sur node
CREATE OR REPLACE FUNCTION public.recalc_node_media_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_node UUID;
  v_count INT;
BEGIN
  v_node := COALESCE(NEW.node_id, OLD.node_id);
  SELECT COUNT(*) INTO v_count FROM public.explore_node_media WHERE node_id = v_node;
  UPDATE public.explore_nodes SET media_count = v_count, updated_at = now() WHERE id = v_node;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_node_media_count
  AFTER INSERT OR DELETE ON public.explore_node_media
  FOR EACH ROW EXECUTE FUNCTION public.recalc_node_media_count();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.explore_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.explore_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.explore_badges;