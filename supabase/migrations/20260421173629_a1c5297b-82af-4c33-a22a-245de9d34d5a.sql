-- Table trip_documents
CREATE TABLE public.trip_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'other',
  file_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own trip documents"
ON public.trip_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own trip documents"
ON public.trip_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own trip documents"
ON public.trip_documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own trip documents"
ON public.trip_documents FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_trip_documents_updated_at
BEFORE UPDATE ON public.trip_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_trip_documents_trip ON public.trip_documents(trip_id);
CREATE INDEX idx_trip_documents_user ON public.trip_documents(user_id);

-- Bucket privé pour les fichiers
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-documents', 'trip-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (organisé par user_id/trip_id/filename)
CREATE POLICY "Users view own trip files"
ON storage.objects FOR SELECT
USING (bucket_id = 'trip-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own trip files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'trip-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own trip files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'trip-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own trip files"
ON storage.objects FOR DELETE
USING (bucket_id = 'trip-documents' AND auth.uid()::text = (storage.foldername(name))[1]);