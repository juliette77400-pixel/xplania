-- mood_selections : historique des moods
CREATE TABLE public.mood_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mood TEXT NOT NULL,
  free_input TEXT,
  energy_level INTEGER,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  weather TEXT,
  time_of_day TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mood_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own mood selections" ON public.mood_selections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own mood selections" ON public.mood_selections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own mood selections" ON public.mood_selections FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_mood_selections_user ON public.mood_selections(user_id, created_at DESC);

-- mood_places : lieux recommandés par l'IA
CREATE TABLE public.mood_places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  selection_id UUID,
  mood TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  why_fits TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  image_url TEXT,
  distance_km DOUBLE PRECISION,
  duration_min INTEGER,
  tips TEXT,
  hidden_gem BOOLEAN NOT NULL DEFAULT false,
  score INTEGER NOT NULL DEFAULT 50,
  source TEXT NOT NULL DEFAULT 'ai',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mood_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own mood places" ON public.mood_places FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own mood places" ON public.mood_places FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own mood places" ON public.mood_places FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own mood places" ON public.mood_places FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_mood_places_user_mood ON public.mood_places(user_id, mood, created_at DESC);
CREATE INDEX idx_mood_places_selection ON public.mood_places(selection_id);

-- mood_favorites : favoris
CREATE TABLE public.mood_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  place_id UUID NOT NULL REFERENCES public.mood_places(id) ON DELETE CASCADE,
  trip_id UUID,
  note TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_id)
);

ALTER TABLE public.mood_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own mood favorites" ON public.mood_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own mood favorites" ON public.mood_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own mood favorites" ON public.mood_favorites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own mood favorites" ON public.mood_favorites FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_mood_favorites_user ON public.mood_favorites(user_id, saved_at DESC);