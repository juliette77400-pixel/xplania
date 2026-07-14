
-- user_memory: one row per user, stores likes/dislikes/preferences derived from user actions
CREATE TABLE public.user_memory (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  likes TEXT[] NOT NULL DEFAULT '{}',
  dislikes TEXT[] NOT NULL DEFAULT '{}',
  saved_experiences JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_memory TO authenticated;
GRANT ALL ON public.user_memory TO service_role;
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_memory_own_select" ON public.user_memory FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_memory_own_insert" ON public.user_memory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_memory_own_update" ON public.user_memory FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_memory_own_delete" ON public.user_memory FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_user_memory_updated_at BEFORE UPDATE ON public.user_memory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- user_recommendations_history: track what was already shown / liked / rejected per user
CREATE TABLE public.user_recommendations_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,        -- stable identifier (name or destination slug)
  item_type TEXT NOT NULL,       -- 'place' | 'destination' | 'experience' | 'mood_place'
  source TEXT,                   -- 'mood-recommend' | 'discover' | 'travel-recommendations' ...
  shown BOOLEAN NOT NULL DEFAULT true,
  liked BOOLEAN,                 -- null = neutral, true = liked, false = rejected
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_key, item_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_recommendations_history TO authenticated;
GRANT ALL ON public.user_recommendations_history TO service_role;
ALTER TABLE public.user_recommendations_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "urh_own_select" ON public.user_recommendations_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "urh_own_insert" ON public.user_recommendations_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "urh_own_update" ON public.user_recommendations_history FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "urh_own_delete" ON public.user_recommendations_history FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_urh_user_created ON public.user_recommendations_history (user_id, created_at DESC);
CREATE TRIGGER trg_urh_updated_at BEFORE UPDATE ON public.user_recommendations_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
