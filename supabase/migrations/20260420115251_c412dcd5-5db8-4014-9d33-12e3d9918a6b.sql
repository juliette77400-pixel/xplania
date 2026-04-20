-- Mood badges (gamification)
CREATE TABLE public.mood_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);

ALTER TABLE public.mood_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own mood badges" ON public.mood_badges
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own mood badges" ON public.mood_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own mood badges" ON public.mood_badges
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_mood_badges_user ON public.mood_badges(user_id);

-- Mood reactions (social)
CREATE TABLE public.mood_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  place_id UUID NOT NULL,
  mood TEXT NOT NULL,
  emoji TEXT,
  comment TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  place_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mood_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mood reactions" ON public.mood_reactions
  FOR SELECT USING (true);
CREATE POLICY "Users insert own mood reactions" ON public.mood_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own mood reactions" ON public.mood_reactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own mood reactions" ON public.mood_reactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_mood_reactions_place ON public.mood_reactions(place_id);
CREATE INDEX idx_mood_reactions_mood_created ON public.mood_reactions(mood, created_at DESC);
CREATE INDEX idx_mood_reactions_user ON public.mood_reactions(user_id);