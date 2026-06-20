
DROP POLICY IF EXISTS "place-reviews read referenced photos" ON storage.objects;

CREATE POLICY "place-reviews read referenced photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'place-reviews'
  AND EXISTS (
    SELECT 1 FROM public.place_reviews pr
    WHERE pr.photo_url IS NOT NULL
      AND (pr.photo_url = name OR pr.photo_url LIKE '%/' || name)
  )
);
