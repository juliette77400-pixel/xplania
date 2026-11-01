-- AI results saved with the student's trip (Visa analysis, Budget tips, Valise tip and outfits),
-- so reopening a page on any device shows them again without a new AI call.
CREATE TABLE public.trip_ai_results (
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('visa', 'budget_insights', 'valise_tip', 'valise_outfits')),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  input_key text NOT NULL DEFAULT '' CHECK (char_length(input_key) <= 2000),
  locale text NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr', 'en')),
  content jsonb NOT NULL CHECK (pg_column_size(content) <= 200000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, kind)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_ai_results TO authenticated;
GRANT ALL ON public.trip_ai_results TO service_role;

ALTER TABLE public.trip_ai_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own trip AI results" ON public.trip_ai_results
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users save AI results on own trips" ON public.trip_ai_results
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Users update AI results on own trips" ON public.trip_ai_results
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Users delete own trip AI results" ON public.trip_ai_results
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX trip_ai_results_user_idx ON public.trip_ai_results (user_id);