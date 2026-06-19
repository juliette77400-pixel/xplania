
ALTER TABLE public.journals
  ADD COLUMN IF NOT EXISTS cover_source text NOT NULL DEFAULT 'unsplash',
  ADD COLUMN IF NOT EXISTS style_profile jsonb,
  ADD COLUMN IF NOT EXISTS style_profile_updated_at timestamptz;

ALTER TABLE public.trip_documents
  ADD COLUMN IF NOT EXISTS day_id uuid REFERENCES public.journal_days(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trip_documents_day ON public.trip_documents(day_id);
