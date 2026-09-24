ALTER TABLE public.place_lists
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_slug text UNIQUE;

CREATE POLICY "Anyone can view public lists" ON public.place_lists
  FOR SELECT TO anon, authenticated USING (is_public = true AND share_slug IS NOT NULL);

CREATE OR REPLACE FUNCTION public.is_public_place_list(_list_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.place_lists WHERE id = _list_id AND is_public = true AND share_slug IS NOT NULL);
$$;
GRANT EXECUTE ON FUNCTION public.is_public_place_list(uuid) TO anon, authenticated;

CREATE POLICY "Anyone can view items of public lists" ON public.place_list_items
  FOR SELECT TO anon, authenticated USING (public.is_public_place_list(list_id));

GRANT SELECT ON public.place_lists TO anon;
GRANT SELECT ON public.place_list_items TO anon;

CREATE TABLE public.google_place_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.google_place_cache TO service_role;
ALTER TABLE public.google_place_cache ENABLE ROW LEVEL SECURITY;