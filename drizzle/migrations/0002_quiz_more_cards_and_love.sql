ALTER TABLE public.user_swipes DROP CONSTRAINT IF EXISTS user_swipes_direction_check;
ALTER TABLE public.user_swipes ADD CONSTRAINT user_swipes_direction_check CHECK (direction = ANY (ARRAY['right','left','skip','love']));

INSERT INTO public.tinder_cards (name, unsplash_query, phrase_fr, phrase_en, score_tags, order_index, active)
SELECT v.name, v.q, v.fr, v.en, v.tags::jsonb, v.ord, true
FROM (VALUES
 ('train_nuit','night train sleeper cabin window','Traverser un pays en train de nuit','Crossing a country on a night train','{"adventure":1,"nomad":1,"originality":1}',21),
 ('van_life','camper van nature sunrise','Dormir dans un van face à la mer','Sleeping in a van facing the sea','{"adventure":2,"budget":1}',22),
 ('cours_cuisine','cooking class local family','Cuisiner avec une famille locale','Cooking with a local family','{"food":2,"authenticity":2}',23),
 ('croisiere','cruise ship deck ocean','Une croisière tout compris','An all-inclusive cruise','{"comfort":2,"organization":1}',24),
 ('velo_ville','city bike tour cyclists','Visiter une ville entière à vélo','Exploring a whole city by bike','{"adventure":1,"nature":1}',25),
 ('benevolat','volunteering abroad community project','Faire du bénévolat pendant son voyage','Volunteering during your trip','{"social":2,"authenticity":2}',26),
 ('festival_musique','music festival crowd night','Un grand festival de musique','A big music festival','{"social":2}',27),
 ('temple_aube','temple sunrise meditation monk','Méditer dans un temple au lever du soleil','Meditating in a temple at sunrise','{"wellbeing":2,"culture":1}',28),
 ('plongee','scuba diving coral reef','Plonger au milieu des récifs coralliens','Diving among coral reefs','{"adventure":2,"nature":1}',29),
 ('voyage_solo','solo traveler backpack city','Partir seul(e) à l''autre bout du monde','Traveling solo to the other side of the world','{"adventure":1,"social":1}',30),
 ('chez_habitant','homestay local house guest','Dormir chez l''habitant plutôt qu''à l''hôtel','Staying with locals instead of a hotel','{"authenticity":2,"budget":1}',31),
 ('safari','safari wildlife savanna jeep','Un safari pour voir les animaux sauvages','A safari to see wild animals','{"nature":2,"adventure":1}',32),
 ('shopping_luxe','luxury shopping boutique street','Faire du shopping dans les grandes boutiques','Shopping in luxury boutiques','{"luxury":2}',33),
 ('aurores','northern lights snow night','Voir des aurores boréales','Seeing the northern lights','{"nature":2,"originality":1}',34),
 ('tout_organise','travel agency guided tour group','Un voyage organisé où tout est prévu','An organized tour where everything is planned','{"organization":2,"comfort":1}',35),
 ('sans_avion','train travel europe landscape','Voyager sans prendre l''avion','Traveling without flying','{"nature":1,"organization":1}',36)
) AS v(name,q,fr,en,tags,ord)
WHERE NOT EXISTS (SELECT 1 FROM public.tinder_cards c WHERE c.name = v.name);