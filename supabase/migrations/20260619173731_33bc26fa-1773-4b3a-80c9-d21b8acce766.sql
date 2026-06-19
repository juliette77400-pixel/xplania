
CREATE TABLE public.mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_selection_id UUID REFERENCES public.mood_selections(id) ON DELETE SET NULL,
  mood_tags TEXT[] NOT NULL DEFAULT '{}',
  satisfaction_rating SMALLINT CHECK (satisfaction_rating BETWEEN 1 AND 5),
  note TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_entries TO authenticated;
GRANT ALL ON public.mood_entries TO service_role;

ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own mood entries" ON public.mood_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own mood entries" ON public.mood_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own mood entries" ON public.mood_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own mood entries" ON public.mood_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX mood_entries_user_date_idx ON public.mood_entries (user_id, entry_date DESC);
