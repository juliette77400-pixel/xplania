
GRANT SELECT ON public.tinder_cards TO anon;
GRANT SELECT ON public.tinder_cards TO authenticated;
GRANT ALL ON public.tinder_cards TO service_role;

DROP POLICY IF EXISTS "Authenticated users can read active cards" ON public.tinder_cards;
CREATE POLICY "Anyone can read active tinder cards"
  ON public.tinder_cards FOR SELECT
  TO anon, authenticated
  USING (active = true);

UPDATE public.tinder_cards SET image_url = CASE name
  WHEN 'marche_local' THEN 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80'
  WHEN 'rooftop_bar' THEN 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&q=80'
  WHEN 'trek_montagne' THEN 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80'
  WHEN 'coworking' THEN 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80'
  WHEN 'street_food' THEN 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'
  WHEN 'plage_isolee' THEN 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
  WHEN 'hotel_5_etoiles' THEN 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'
  WHEN 'auberge_partage' THEN 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80'
  WHEN 'musee_histoire' THEN 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&q=80'
  WHEN 'saut_parachute' THEN 'https://images.unsplash.com/photo-1521673461164-de300ebcfb17?w=800&q=80'
  WHEN 'retraite_yoga' THEN 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80'
  WHEN 'roadtrip_libre' THEN 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80'
  WHEN 'planning_minute' THEN 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80'
  WHEN 'fete_locale' THEN 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80'
  WHEN 'budget_serre' THEN 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&q=80'
  WHEN 'atelier_artisanat' THEN 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=80'
  WHEN 'spa_montagne' THEN 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80'
  WHEN 'visa_nomade' THEN 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80'
  WHEN 'resto_gastronomique' THEN 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'
  WHEN 'rando_nature' THEN 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'
END
WHERE image_url IS NULL;
