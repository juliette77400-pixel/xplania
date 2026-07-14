-- =========================================
-- Tinder Onboarding Voyageur — Vague 1
-- =========================================

-- 1. tinder_cards (catalogue public authentifié)
CREATE TABLE public.tinder_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  image_url text,
  unsplash_query text NOT NULL,
  phrase_fr text NOT NULL,
  phrase_en text NOT NULL,
  score_tags jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_index int NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tinder_cards TO authenticated;
GRANT ALL ON public.tinder_cards TO service_role;

ALTER TABLE public.tinder_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active cards"
  ON public.tinder_cards FOR SELECT
  TO authenticated
  USING (active = true);

-- 2. traveler_profiles (profil du voyageur, un par user)
CREATE TABLE public.traveler_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  culture_score int NOT NULL DEFAULT 0,
  adventure_score int NOT NULL DEFAULT 0,
  nature_score int NOT NULL DEFAULT 0,
  comfort_score int NOT NULL DEFAULT 0,
  budget_score int NOT NULL DEFAULT 0,
  food_score int NOT NULL DEFAULT 0,
  authenticity_score int NOT NULL DEFAULT 0,
  social_score int NOT NULL DEFAULT 0,
  wellbeing_score int NOT NULL DEFAULT 0,
  nomad_score int NOT NULL DEFAULT 0,
  luxury_score int NOT NULL DEFAULT 0,
  organization_score int NOT NULL DEFAULT 0,
  badge text,
  badge_description text,
  recommended_features text[] NOT NULL DEFAULT '{}',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.traveler_profiles TO authenticated;
GRANT ALL ON public.traveler_profiles TO service_role;

ALTER TABLE public.traveler_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own traveler profile"
  ON public.traveler_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own traveler profile"
  ON public.traveler_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own traveler profile"
  ON public.traveler_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own traveler profile"
  ON public.traveler_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER traveler_profiles_updated_at
  BEFORE UPDATE ON public.traveler_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. user_swipes (historique)
CREATE TABLE public.user_swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.tinder_cards(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('right','left','skip')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, card_id)
);

CREATE INDEX user_swipes_user_id_idx ON public.user_swipes(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_swipes TO authenticated;
GRANT ALL ON public.user_swipes TO service_role;

ALTER TABLE public.user_swipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own swipes"
  ON public.user_swipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own swipes"
  ON public.user_swipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own swipes"
  ON public.user_swipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own swipes"
  ON public.user_swipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Seed des 20 cartes
INSERT INTO public.tinder_cards (name, unsplash_query, phrase_fr, phrase_en, score_tags, order_index) VALUES
  ('marche_local',        'local market sunrise',              'Se perdre dans un marché local à l''aube',                'Getting lost in a local market at dawn',                    '{"culture":2,"authenticity":2}',              1),
  ('rooftop_bar',         'rooftop bar city view',             'Un rooftop bar avec vue sur la ville',                    'A rooftop bar overlooking the city',                        '{"comfort":1,"luxury":2}',                    2),
  ('trek_montagne',       'mountain trekking backpack',        'Trois jours de trek en autonomie',                        'Three days of self-guided trekking',                        '{"adventure":2,"nature":1}',                  3),
  ('coworking',           'seaside cafe laptop remote work',   'Travailler depuis un café avec vue sur mer',              'Working from a café with an ocean view',                    '{"nomad":2,"comfort":1}',                     4),
  ('street_food',         'street food locals night market',   'Manger où mangent les locaux, pas les touristes',         'Eating where locals eat, not tourists',                     '{"food":2,"authenticity":1}',                 5),
  ('plage_isolee',        'hidden secluded beach',             'Une plage qu''aucun guide ne mentionne',                  'A beach no guidebook mentions',                             '{"nature":2,"authenticity":1}',               6),
  ('hotel_5_etoiles',     'luxury 5 star hotel spa',           'Un hôtel 5 étoiles avec spa',                             'A five-star hotel with a spa',                              '{"luxury":2,"comfort":2}',                    7),
  ('auberge_partage',     'hostel dorm travelers meeting',     'Une auberge de jeunesse pleine de rencontres',            'A hostel buzzing with new encounters',                      '{"social":2,"budget":1}',                     8),
  ('musee_histoire',      'history museum interior',           'Passer l''après-midi dans un musée d''histoire',          'Spending the afternoon in a history museum',                '{"culture":2}',                               9),
  ('saut_parachute',      'skydiving alps mountains',          'Sauter en parachute au-dessus des Alpes',                 'Skydiving over the Alps',                                   '{"adventure":2}',                             10),
  ('retraite_yoga',       'silent yoga retreat forest',        'Une retraite yoga silencieuse en pleine nature',          'A silent yoga retreat in nature',                           '{"wellbeing":2,"nature":1}',                  11),
  ('roadtrip_libre',      'road trip open road convertible',   'Un road trip sans itinéraire fixe',                       'A road trip with no fixed itinerary',                       '{"adventure":1,"organization":-1}',           12),
  ('planning_minute',     'travel planner notebook calendar',  'Un itinéraire minuté heure par heure',                    'An itinerary planned hour by hour',                         '{"organization":2}',                          13),
  ('fete_locale',         'village festival dancing locals',   'Danser à une fête de village locale',                     'Dancing at a local village festival',                       '{"social":2,"culture":1}',                    14),
  ('budget_serre',        'backpacker traveling budget',       'Voyager avec un sac à dos et un petit budget',            'Traveling with a backpack on a tight budget',               '{"budget":2}',                                15),
  ('atelier_artisanat',   'traditional craft workshop artisan','Apprendre un artisanat traditionnel avec un local',       'Learning a traditional craft with a local',                 '{"authenticity":2,"culture":1}',              16),
  ('spa_montagne',        'mountain spa infinity pool',        'Un spa perché dans les montagnes',                        'A spa nestled in the mountains',                            '{"wellbeing":1,"luxury":1,"comfort":1}',      17),
  ('visa_nomade',         'digital nomad long stay apartment', 'S''installer 3 mois quelque part pour travailler',        'Settling somewhere for 3 months to work',                   '{"nomad":2,"organization":1}',                18),
  ('resto_gastronomique', 'fine dining restaurant michelin',   'Un dîner gastronomique étoilé',                           'A Michelin-star gourmet dinner',                            '{"food":2,"luxury":1}',                       19),
  ('rando_nature',        'hiking wilderness remote nature',   'Une randonnée au milieu de nulle part',                   'A hike in the middle of nowhere',                           '{"nature":2,"adventure":1}',                  20);