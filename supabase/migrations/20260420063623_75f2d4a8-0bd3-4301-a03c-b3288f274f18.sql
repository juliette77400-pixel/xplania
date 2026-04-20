
-- =========================================================
-- 1. Utility: updated_at trigger function
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- 2. Profiles
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- 3. Trips
-- =========================================================
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  destination TEXT,
  arrival_city TEXT,
  departure_location TEXT,
  departure_date DATE,
  return_date DATE,
  duration INTEGER,
  form_data JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trips_user_id ON public.trips(user_id);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trips"
  ON public.trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 4. Journals (Carnet de Bord)
-- =========================================================
CREATE TABLE public.journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Mon carnet de voyage',
  cover_url TEXT,
  tone TEXT NOT NULL DEFAULT 'storytelling',
  is_public BOOLEAN NOT NULL DEFAULT false,
  public_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journals_trip_id ON public.journals(trip_id);
CREATE INDEX idx_journals_user_id ON public.journals(user_id);
CREATE INDEX idx_journals_public_slug ON public.journals(public_slug);

ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journals"
  ON public.journals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public journals"
  ON public.journals FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own journals"
  ON public.journals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journals"
  ON public.journals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journals"
  ON public.journals FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_journals_updated_at
  BEFORE UPDATE ON public.journals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 5. Journal days
-- =========================================================
CREATE TABLE public.journal_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT,
  summary TEXT,
  weather JSONB,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_days_journal_id ON public.journal_days(journal_id);
CREATE INDEX idx_journal_days_user_id ON public.journal_days(user_id);

ALTER TABLE public.journal_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journal days"
  ON public.journal_days FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view days of public journals"
  ON public.journal_days FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.journals j WHERE j.id = journal_id AND j.is_public = true));

CREATE POLICY "Users can insert their own journal days"
  ON public.journal_days FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal days"
  ON public.journal_days FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal days"
  ON public.journal_days FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_journal_days_updated_at
  BEFORE UPDATE ON public.journal_days
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 6. Journal blocks (modular memory blocks)
-- =========================================================
CREATE TABLE public.journal_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.journal_days(id) ON DELETE CASCADE,
  journal_id UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note','photo','video','location','mood','audio','highlight')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_blocks_day_id ON public.journal_blocks(day_id);
CREATE INDEX idx_journal_blocks_journal_id ON public.journal_blocks(journal_id);
CREATE INDEX idx_journal_blocks_user_id ON public.journal_blocks(user_id);

ALTER TABLE public.journal_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journal blocks"
  ON public.journal_blocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view blocks of public journals"
  ON public.journal_blocks FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.journals j WHERE j.id = journal_id AND j.is_public = true));

CREATE POLICY "Users can insert their own journal blocks"
  ON public.journal_blocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal blocks"
  ON public.journal_blocks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal blocks"
  ON public.journal_blocks FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_journal_blocks_updated_at
  BEFORE UPDATE ON public.journal_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 7. Journal stories (AI-generated narratives)
-- =========================================================
CREATE TABLE public.journal_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tone TEXT NOT NULL DEFAULT 'storytelling',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_stories_journal_id ON public.journal_stories(journal_id);
CREATE INDEX idx_journal_stories_user_id ON public.journal_stories(user_id);

ALTER TABLE public.journal_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journal stories"
  ON public.journal_stories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view stories of public journals"
  ON public.journal_stories FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.journals j WHERE j.id = journal_id AND j.is_public = true));

CREATE POLICY "Users can insert their own journal stories"
  ON public.journal_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal stories"
  ON public.journal_stories FOR DELETE
  USING (auth.uid() = user_id);

-- =========================================================
-- 8. Journal badges
-- =========================================================
CREATE TABLE public.journal_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journal_id UUID REFERENCES public.journals(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, journal_id, code)
);

CREATE INDEX idx_journal_badges_user_id ON public.journal_badges(user_id);

ALTER TABLE public.journal_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
  ON public.journal_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
  ON public.journal_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own badges"
  ON public.journal_badges FOR DELETE
  USING (auth.uid() = user_id);

-- =========================================================
-- 9. Storage bucket for journal media
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-media', 'journal-media', false);

-- Owner-scoped read/write/update/delete (folder = user_id)
CREATE POLICY "Users can read their own journal media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own journal media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own journal media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own journal media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public read for media belonging to a public journal (folder layout: user_id/journal_id/...)
CREATE POLICY "Public can read media of public journals"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'journal-media'
    AND EXISTS (
      SELECT 1 FROM public.journals j
      WHERE j.is_public = true
        AND j.id::text = (storage.foldername(name))[2]
    )
  );
