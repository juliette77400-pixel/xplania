
CREATE TABLE public.rag_seed_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_key TEXT NOT NULL UNIQUE,
  destination_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  document_id UUID REFERENCES public.travel_documents(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'inserted', -- 'inserted' | 'embedded' | 'error'
  error_message TEXT,
  seeded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rag_seed_status TO authenticated;
GRANT ALL ON public.rag_seed_status TO service_role;
ALTER TABLE public.rag_seed_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rag_seed_status_admin_read" ON public.rag_seed_status
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_rag_seed_status_updated_at BEFORE UPDATE ON public.rag_seed_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
