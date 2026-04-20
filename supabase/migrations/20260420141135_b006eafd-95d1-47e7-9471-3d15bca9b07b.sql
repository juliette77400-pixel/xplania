-- PLACES (public catalog)
CREATE TABLE public.places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'osm',
  osm_id TEXT,
  created_by UUID,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  description TEXT,
  why_fits TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  address TEXT,
  opening_hours JSONB,
  price_level INTEGER,
  tips TEXT,
  hidden_gem BOOLEAN NOT NULL DEFAULT false,
  score INTEGER NOT NULL DEFAULT 50,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, osm_id)
);

CREATE INDEX idx_places_latlng ON public.places (lat, lng);
CREATE INDEX idx_places_category ON public.places (category);
CREATE INDEX idx_places_tags ON public.places USING GIN (tags);

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Places are viewable by everyone"
  ON public.places FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert places"
  ON public.places FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own places"
  ON public.places FOR UPDATE TO authenticated
  USING (created_by IS NULL OR auth.uid() = created_by);

CREATE POLICY "Users can delete their own community places"
  ON public.places FOR DELETE TO authenticated
  USING (auth.uid() = created_by AND source = 'community');

CREATE TRIGGER trg_places_updated_at
  BEFORE UPDATE ON public.places
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PLACE REVIEWS
CREATE TABLE public.place_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (place_id, user_id)
);

CREATE INDEX idx_place_reviews_place ON public.place_reviews (place_id);
ALTER TABLE public.place_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews viewable by everyone"
  ON public.place_reviews FOR SELECT USING (true);
CREATE POLICY "Users insert own reviews"
  ON public.place_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews"
  ON public.place_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews"
  ON public.place_reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Recompute rating
CREATE OR REPLACE FUNCTION public.recalc_place_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_place UUID; v_avg NUMERIC; v_count INT;
BEGIN
  v_place := COALESCE(NEW.place_id, OLD.place_id);
  SELECT COALESCE(AVG(rating), 0), COUNT(*) INTO v_avg, v_count
    FROM public.place_reviews WHERE place_id = v_place;
  UPDATE public.places SET rating_avg = ROUND(v_avg, 2), rating_count = v_count, updated_at = now()
    WHERE id = v_place;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_reviews_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.place_reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalc_place_rating();

-- PLACE LISTS
CREATE TABLE public.place_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📍',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_place_lists_user ON public.place_lists (user_id);
ALTER TABLE public.place_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own lists" ON public.place_lists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own lists" ON public.place_lists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own lists" ON public.place_lists FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own lists" ON public.place_lists FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_place_lists_updated_at
  BEFORE UPDATE ON public.place_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer to check list ownership without recursion
CREATE OR REPLACE FUNCTION public.owns_place_list(_list_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.place_lists WHERE id = _list_id AND user_id = _user_id);
$$;

-- PLACE LIST ITEMS
CREATE TABLE public.place_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.place_lists(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  note TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (list_id, place_id)
);

CREATE INDEX idx_list_items_list ON public.place_list_items (list_id);
CREATE INDEX idx_list_items_user ON public.place_list_items (user_id);
ALTER TABLE public.place_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own list items" ON public.place_list_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own list items" ON public.place_list_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.owns_place_list(list_id, auth.uid()));
CREATE POLICY "Users update own list items" ON public.place_list_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own list items" ON public.place_list_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- DISCOVER NOTIFICATIONS
CREATE TABLE public.discover_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  place_id UUID REFERENCES public.places(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_disc_notif_user ON public.discover_notifications (user_id, sent_at DESC);
ALTER TABLE public.discover_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.discover_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notifications" ON public.discover_notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.discover_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.discover_notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);