DROP POLICY IF EXISTS "Public can read media of public journals" ON storage.objects;

DROP POLICY IF EXISTS "Places are viewable by everyone" ON public.places;
CREATE POLICY "Places viewable by signed-in users or via public lists"
ON public.places FOR SELECT
TO anon, authenticated
USING (
  auth.uid() IS NOT NULL
  OR EXISTS (
    SELECT 1 FROM public.place_list_items i
    JOIN public.place_lists l ON l.id = i.list_id
    WHERE i.place_id = places.id AND l.is_public = true
  )
);