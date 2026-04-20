-- Bucket public pour photos de reviews
INSERT INTO storage.buckets (id, name, public)
VALUES ('place-reviews', 'place-reviews', true)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique
CREATE POLICY "Place review photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'place-reviews');

-- Upload par user authentifié dans son dossier
CREATE POLICY "Users upload own review photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'place-reviews'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update / delete sur ses propres fichiers
CREATE POLICY "Users update own review photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'place-reviews'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own review photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'place-reviews'
  AND auth.uid()::text = (storage.foldername(name))[1]
);