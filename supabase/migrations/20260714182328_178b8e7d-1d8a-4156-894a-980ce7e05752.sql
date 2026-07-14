
-- Enable pgvector for semantic search
create extension if not exists vector;

-- =====================================================================
-- Wave 3: destinations DNA
-- =====================================================================
CREATE TABLE public.destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  -- 12 dimensions same as traveler_profiles, scored 0-100
  culture_score INT NOT NULL DEFAULT 0,
  adventure_score INT NOT NULL DEFAULT 0,
  nature_score INT NOT NULL DEFAULT 0,
  comfort_score INT NOT NULL DEFAULT 0,
  budget_score INT NOT NULL DEFAULT 0,
  food_score INT NOT NULL DEFAULT 0,
  authenticity_score INT NOT NULL DEFAULT 0,
  social_score INT NOT NULL DEFAULT 0,
  wellbeing_score INT NOT NULL DEFAULT 0,
  nomad_score INT NOT NULL DEFAULT 0,
  luxury_score INT NOT NULL DEFAULT 0,
  organization_score INT NOT NULL DEFAULT 0,
  -- Originality: 0 = ultra touristique, 100 = confidentiel
  originality_score INT NOT NULL DEFAULT 50,
  tourism_mass INT NOT NULL DEFAULT 50,
  hero_image_url TEXT,
  summary_fr TEXT,
  summary_en TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  best_seasons TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.destinations TO authenticated;
GRANT ALL ON public.destinations TO service_role;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "destinations_read_auth" ON public.destinations FOR SELECT TO authenticated USING (active = true);
CREATE TRIGGER trg_destinations_updated_at BEFORE UPDATE ON public.destinations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- Wave 4: hidden gems
-- =====================================================================
CREATE TABLE public.hidden_gems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'place', -- 'place' | 'experience' | 'event'
  summary_fr TEXT,
  summary_en TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  best_season TEXT,
  originality_score INT NOT NULL DEFAULT 80,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source TEXT,
  source_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hidden_gems TO authenticated;
GRANT ALL ON public.hidden_gems TO service_role;
ALTER TABLE public.hidden_gems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hidden_gems_read_auth" ON public.hidden_gems FOR SELECT TO authenticated USING (active = true);
CREATE INDEX idx_hidden_gems_destination ON public.hidden_gems (destination_id);
CREATE TRIGGER trg_hidden_gems_updated_at BEFORE UPDATE ON public.hidden_gems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- Wave 4: travel documents (RAG)
-- =====================================================================
CREATE TABLE public.travel_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE,
  destination_slug TEXT, -- denormalized for easy filtering
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- 'culture' | 'visa' | 'nomad' | 'food' | 'nature' | 'general'
  locale TEXT NOT NULL DEFAULT 'fr',
  source TEXT,
  source_url TEXT,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.travel_documents TO authenticated;
GRANT ALL ON public.travel_documents TO service_role;
ALTER TABLE public.travel_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "travel_documents_read_auth" ON public.travel_documents FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_travel_documents_destination ON public.travel_documents (destination_id);
CREATE INDEX idx_travel_documents_slug ON public.travel_documents (destination_slug);
CREATE INDEX idx_travel_documents_embedding ON public.travel_documents USING hnsw (embedding vector_cosine_ops);
CREATE TRIGGER trg_travel_documents_updated_at BEFORE UPDATE ON public.travel_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Semantic search function
CREATE OR REPLACE FUNCTION public.match_travel_documents(
  query_embedding vector(1536),
  match_count int DEFAULT 4,
  filter_destination_slug text DEFAULT NULL,
  filter_locale text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  destination_slug text,
  title text,
  content text,
  category text,
  locale text,
  source text,
  source_url text,
  similarity float
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT d.id, d.destination_slug, d.title, d.content, d.category, d.locale, d.source, d.source_url,
         1 - (d.embedding <=> query_embedding) AS similarity
  FROM public.travel_documents d
  WHERE d.embedding IS NOT NULL
    AND (filter_destination_slug IS NULL OR d.destination_slug = filter_destination_slug)
    AND (filter_locale IS NULL OR d.locale = filter_locale)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
$$;
REVOKE ALL ON FUNCTION public.match_travel_documents(vector, int, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_travel_documents(vector, int, text, text) TO authenticated, service_role;

-- =====================================================================
-- Seed destinations (mix popular + hidden)
-- =====================================================================
INSERT INTO public.destinations (slug, name, country, region, lat, lng,
  culture_score, adventure_score, nature_score, comfort_score, budget_score, food_score,
  authenticity_score, social_score, wellbeing_score, nomad_score, luxury_score, organization_score,
  originality_score, tourism_mass, summary_fr, summary_en, tags, best_seasons) VALUES
('kyoto', 'Kyoto', 'Japon', 'Kansai', 35.0116, 135.7681,
  95, 30, 55, 70, 40, 85, 80, 45, 75, 40, 60, 75,
  55, 85, 'Ancienne capitale impériale : temples zen, ruelles de Gion, cérémonies du thé et cerisiers.',
  'Ancient imperial capital: zen temples, Gion alleys, tea ceremonies, and cherry blossoms.',
  ARRAY['temples','zen','matcha','geisha','cerisiers'], ARRAY['spring','autumn']),
('tokyo', 'Tokyo', 'Japon', 'Kanto', 35.6762, 139.6503,
  80, 40, 30, 85, 45, 95, 55, 75, 55, 75, 80, 85,
  30, 90, 'Megapole vibrante : ruelles néon, ramen de minuit, quartiers ultra spécialisés et micro-cafés.',
  'Vibrant megacity: neon alleys, midnight ramen, hyper-specialized neighborhoods and micro-cafes.',
  ARRAY['neon','ramen','izakaya','otaku','nomad'], ARRAY['spring','autumn']),
('kanazawa', 'Kanazawa', 'Japon', 'Chubu', 36.5613, 136.6562,
  85, 40, 60, 65, 55, 80, 90, 40, 70, 30, 40, 60,
  90, 30, 'Petit joyau des samouraïs : jardin Kenroku-en, quartier des geishas et art contemporain.',
  'Samurai jewel: Kenroku-en garden, geisha district and contemporary art.',
  ARRAY['samurai','jardin','artisanat','feuille-or'], ARRAY['spring','autumn']),
('takayama', 'Takayama', 'Japon', 'Chubu', 36.1408, 137.2521,
  75, 55, 80, 55, 60, 70, 95, 35, 70, 20, 30, 45,
  95, 20, 'Village montagneux préservé : maisons Edo, marchés matinaux et onsen cachés.',
  'Preserved mountain village: Edo houses, morning markets and hidden onsen.',
  ARRAY['montagne','onsen','tradition','marché'], ARRAY['spring','autumn','winter']),
('lisbon', 'Lisbonne', 'Portugal', 'Estremadura', 38.7223, -9.1393,
  75, 35, 45, 75, 65, 85, 65, 80, 55, 85, 55, 60,
  45, 80, 'Sept collines, tramways jaunes, fado mélancolique et pastéis de nata.',
  'Seven hills, yellow trams, melancholic fado and pastéis de nata.',
  ARRAY['fado','tram','miradouro','nomad'], ARRAY['spring','autumn']),
('porto', 'Porto', 'Portugal', 'Norte', 41.1579, -8.6291,
  75, 40, 50, 70, 70, 90, 75, 70, 50, 75, 45, 55,
  60, 65, 'Ville authentique : caves à porto, azulejos et Douro sinueux.',
  'Authentic city: port cellars, azulejos and winding Douro.',
  ARRAY['porto','azulejo','douro','vin'], ARRAY['spring','summer','autumn']),
('marrakech', 'Marrakech', 'Maroc', 'Marrakech-Safi', 31.6295, -7.9811,
  85, 55, 30, 65, 70, 85, 80, 75, 60, 40, 65, 40,
  50, 85, 'Souks labyrinthiques, riads en zellige, place Jemaa el-Fna et Atlas en toile de fond.',
  'Labyrinthine souks, tiled riads, Jemaa el-Fna square and Atlas as backdrop.',
  ARRAY['souk','riad','medina','atlas'], ARRAY['spring','autumn','winter']),
('chefchaouen', 'Chefchaouen', 'Maroc', 'Tanger-Tetouan', 35.1688, -5.2636,
  80, 55, 75, 55, 75, 65, 90, 55, 65, 25, 30, 40,
  85, 40, 'Perle bleue du Rif : ruelles indigo, randonnées berbères et calme montagneux.',
  'Blue pearl of the Rif: indigo alleys, Berber hikes and mountain calm.',
  ARRAY['bleu','montagne','rif','photo'], ARRAY['spring','autumn']),
('ljubljana', 'Ljubljana', 'Slovénie', 'Central', 46.0569, 14.5058,
  75, 60, 85, 70, 70, 65, 75, 60, 70, 70, 45, 65,
  85, 30, 'Capitale verte confidentielle : rives piétonnes, châteaux et forêts alpines à 30 min.',
  'Green under-the-radar capital: pedestrian riverbanks, castles and alpine forests 30 min away.',
  ARRAY['green','alps','walking','nomad'], ARRAY['spring','summer','autumn']),
('tbilisi', 'Tbilissi', 'Géorgie', 'Kartlie', 41.7151, 44.8271,
  75, 65, 60, 60, 85, 90, 85, 70, 60, 80, 40, 50,
  90, 35, 'Vieille ville en bois, bains sulfureux, vignobles millénaires et scène nomade émergente.',
  'Wooden old town, sulphur baths, millennia-old vineyards and emerging nomad scene.',
  ARRAY['wine','baths','caucasus','nomad'], ARRAY['spring','autumn']),
('barcelona', 'Barcelone', 'Espagne', 'Catalogne', 41.3851, 2.1734,
  80, 45, 50, 80, 55, 90, 55, 90, 60, 80, 65, 65,
  25, 95, 'Modernisme Gaudí, plages urbaines, tapas et vie nocturne infinie.',
  'Gaudí modernism, urban beaches, tapas and endless nightlife.',
  ARRAY['gaudi','tapas','plage','nightlife'], ARRAY['spring','autumn']),
('girona', 'Gérone', 'Espagne', 'Catalogne', 41.9794, 2.8214,
  80, 55, 65, 70, 65, 85, 80, 55, 65, 55, 55, 60,
  75, 45, 'Vieille ville médiévale, gastronomie catalane et cyclisme dans l''arrière-pays.',
  'Medieval old town, Catalan gastronomy and cycling in the hinterland.',
  ARRAY['medieval','gastronomy','cycling'], ARRAY['spring','autumn']);

-- =====================================================================
-- Seed hidden gems (2 per destination)
-- =====================================================================
INSERT INTO public.hidden_gems (destination_id, name, kind, summary_fr, summary_en, best_season, originality_score, tags, source)
SELECT d.id, x.name, x.kind, x.summary_fr, x.summary_en, x.best_season, x.originality_score, x.tags, 'seed'
FROM public.destinations d
JOIN (VALUES
  ('kyoto', 'Ohara — village niché au nord', 'place', 'Village rural à 1h du centre, temples silencieux (Sanzen-in) et champs de shiso.', 'Rural village 1h from center, silent temples (Sanzen-in) and shiso fields.', 'autumn', 88, ARRAY['temple','campagne','silence']),
  ('kyoto', 'Petit-déjeuner tofu chez Okutan', 'experience', 'Cuisine yudofu centenaire près de Nanzen-ji, ambiance zen matinale.', 'Century-old yudofu cuisine near Nanzen-ji, morning zen ambiance.', 'all', 82, ARRAY['tofu','tradition','matin']),
  ('tokyo', 'Yanaka — vieux Tokyo échappé aux bombes', 'place', 'Quartier low-rise avec cimetière apaisant, artisans et cafés d''époque.', 'Low-rise neighborhood with peaceful cemetery, craftsmen and vintage cafes.', 'all', 85, ARRAY['old-tokyo','walk','cats']),
  ('tokyo', 'Kissaten Toricoro — jazz + café siphon', 'experience', 'Café-jazz caché sous une gare, torréfaction siphon et vinyls des 60s.', 'Hidden jazz cafe under a station, siphon roasting and 60s vinyls.', 'all', 90, ARRAY['jazz','coffee','vintage']),
  ('kanazawa', 'Higashi Chaya à l''aube', 'experience', 'Quartier de geishas sans un touriste avant 8h, lumière dorée sur les façades.', 'Geisha district with zero tourists before 8am, golden light on facades.', 'all', 90, ARRAY['geisha','sunrise','photo']),
  ('kanazawa', 'D.T. Suzuki Museum', 'place', 'Musée-méditation dédié au philosophe zen, bassin miroir minimaliste.', 'Meditation museum for the zen philosopher, minimalist mirror pool.', 'all', 85, ARRAY['zen','architecture','silence']),
  ('takayama', 'Shirakawa-go en hiver', 'place', 'Village UNESCO aux fermes gassho-zukuri sous la neige, illuminations rares.', 'UNESCO village with gassho-zukuri farms under snow, rare illuminations.', 'winter', 80, ARRAY['unesco','snow','village']),
  ('takayama', 'Onsen forestier Okuhida', 'experience', 'Bains à ciel ouvert perdus en montagne, accessibles en bus local.', 'Open-air baths lost in the mountains, accessible by local bus.', 'winter', 90, ARRAY['onsen','forest','wild']),
  ('lisbon', 'LX Factory dimanche matin', 'place', 'Ancien complexe industriel reconverti : librairie Ler Devagar, brunch et art urbain.', 'Former industrial complex: Ler Devagar bookstore, brunch and urban art.', 'all', 65, ARRAY['bookstore','brunch','art']),
  ('lisbon', 'Fado vadio à Tasca do Chico', 'experience', 'Fado amateur dans une taverne enfumée d''Alfama, sans micro ni scène.', 'Amateur fado in a smoky Alfama tavern, no mic no stage.', 'all', 78, ARRAY['fado','tavern','local']),
  ('porto', 'Livraria Lello au lever', 'experience', 'Librairie néo-gothique célèbre, accessible sans foule avant 10h.', 'Famous neo-gothic bookstore, crowd-free before 10am.', 'all', 60, ARRAY['bookstore','architecture']),
  ('porto', 'Miradouro da Vitória', 'place', 'Vue panoramique sur Ribeira, populaire chez les locaux au coucher du soleil.', 'Panoramic view over Ribeira, local favorite at sunset.', 'all', 70, ARRAY['view','sunset','free']),
  ('marrakech', 'Jardin secret de la Médina', 'place', 'Deux jardins riad restaurés en plein souk, oasis de silence.', 'Two restored riad gardens deep in the souk, silence oasis.', 'all', 65, ARRAY['garden','riad','silence']),
  ('marrakech', 'Hammam traditionnel de quartier', 'experience', 'Hammam populaire hors circuits, gommage rituel avec les habitants.', 'Off-the-beaten-path public hammam, ritual scrub with locals.', 'all', 85, ARRAY['hammam','local','ritual']),
  ('chefchaouen', 'Randonnée au pont de Dieu (Akchour)', 'experience', 'Trek d''une journée vers cascades turquoise et arche naturelle.', 'Day hike to turquoise waterfalls and natural arch.', 'spring', 88, ARRAY['hike','waterfall','nature']),
  ('chefchaouen', 'Coucher de soleil à la Spanish Mosque', 'experience', 'Petite mosquée en ruine au-dessus de la ville, panorama indigo au crépuscule.', 'Small ruined mosque above town, indigo panorama at dusk.', 'all', 78, ARRAY['sunset','view','free']),
  ('ljubljana', 'Vallée du Vintgar', 'place', 'Gorges glaciaires accessibles en bus, passerelles au-dessus d''une rivière turquoise.', 'Glacial gorges accessible by bus, walkways over a turquoise river.', 'summer', 78, ARRAY['gorge','nature','walk']),
  ('ljubljana', 'Metelkova — squat culturel', 'place', 'Ancienne caserne devenue village d''artistes, concerts et graffs monumentaux.', 'Former barracks turned artist village, concerts and monumental graffs.', 'all', 82, ARRAY['squat','art','nightlife']),
  ('tbilisi', 'Bains sulfureux d''Abanotubani', 'experience', 'Bains ottomans en plein centre historique, réservation en cabines privées.', 'Ottoman baths downtown, private cabin bookings.', 'all', 75, ARRAY['baths','wellness','historic']),
  ('tbilisi', 'Route militaire vers Kazbegi', 'experience', 'Road trip dans le Caucase, monastère Gergeti perché à 2200m.', 'Road trip in the Caucasus, Gergeti monastery perched at 2200m.', 'summer', 88, ARRAY['roadtrip','mountains','monastery']),
  ('barcelona', 'Bunkers del Carmel', 'place', 'Vestige de guerre reconverti en spot 360° sur la ville, apéro coucher de soleil.', 'War remnant turned 360° city viewpoint, sunset apero.', 'all', 60, ARRAY['view','sunset','picnic']),
  ('barcelona', 'Marché de la Boqueria à 8h', 'experience', 'Marché mythique sans touristes tôt le matin, tapas au comptoir avec les habitués.', 'Iconic market tourist-free early morning, counter tapas with regulars.', 'all', 55, ARRAY['market','tapas','morning']),
  ('girona', 'Vieux quartier juif à l''aube', 'place', 'Ruelles millénaires du Call sans un touriste, pierres dorées au soleil rasant.', 'Millennia-old Call alleys tourist-free, golden stones at sunrise.', 'all', 80, ARRAY['jewish','medieval','photo']),
  ('girona', 'Cyclotourisme Vies Verdes', 'experience', 'Anciennes voies ferrées reconverties en pistes cyclables vers la Costa Brava.', 'Former rail lines converted to cycling paths towards Costa Brava.', 'spring', 75, ARRAY['cycling','nature','green'])
) AS x(slug, name, kind, summary_fr, summary_en, best_season, originality_score, tags)
  ON d.slug = x.slug;

-- =====================================================================
-- Seed travel_documents (RAG chunks — 1 per destination). Embeddings NULL,
-- to be filled by the `documents-embed` edge function.
-- =====================================================================
INSERT INTO public.travel_documents (destination_id, destination_slug, title, content, category, locale, source)
SELECT d.id, d.slug, d.name || ' — vue d''ensemble', COALESCE(d.summary_fr, d.name), 'general', 'fr', 'seed'
FROM public.destinations d;

INSERT INTO public.travel_documents (destination_id, destination_slug, title, content, category, locale, source) VALUES
((SELECT id FROM public.destinations WHERE slug='kyoto'), 'kyoto', 'Kyoto — culture zen', 'Kyoto compte plus de 1600 temples bouddhistes. Les temples les moins connus (Honen-in, Rurikoin, Enko-ji) offrent la même beauté que Kinkakuji sans les foules. Meilleure période : avril pour les cerisiers, novembre pour les érables rouges.', 'culture', 'fr', 'curated'),
((SELECT id FROM public.destinations WHERE slug='tokyo'), 'tokyo', 'Tokyo — nomade digital', 'Tokyo offre des coworkings 24/7 (WeWork Roppongi, +OURS Ebisu), une connexion fibre partout, mais un visa nomade limité. Alternative : visa Working Holiday pour moins de 30 ans, ou visa Designated Activities pour freelances qualifiés.', 'nomad', 'fr', 'curated'),
((SELECT id FROM public.destinations WHERE slug='lisbon'), 'lisbon', 'Lisbonne — visa D8 nomade', 'Le visa D8 permet aux travailleurs distants de vivre au Portugal jusqu''à 5 ans. Revenus minimum : 3480€/mois. Fiscalité NHR abrogée en 2024, mais le nouveau régime IFICI offre 20% flat sur les revenus qualifiés.', 'visa', 'fr', 'curated'),
((SELECT id FROM public.destinations WHERE slug='marrakech'), 'marrakech', 'Marrakech — souks et étiquette', 'Négocier dans les souks fait partie du jeu : diviser le premier prix par 3-4, sourire, savoir dire "shokran, la" (merci non). Les pousseurs vers un tanneur "gratuit" mènent souvent à un magasin ; refuser poliment.', 'culture', 'fr', 'curated');
