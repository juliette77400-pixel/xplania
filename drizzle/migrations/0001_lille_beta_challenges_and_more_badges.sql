INSERT INTO public.gam_categories (slug, name_fr, name_en, icon, gradient_from, gradient_to, active, position)
SELECT 'lille', 'Défis Lille (bêta)', 'Lille challenges (beta)', '🦁', '#e11d48', '#f59e0b', true, -1
WHERE NOT EXISTS (SELECT 1 FROM public.gam_categories WHERE slug = 'lille');

WITH cat AS (SELECT id FROM public.gam_categories WHERE slug = 'lille'),
v(name_fr, name_en, d_fr, d_en, place, lat, lng, r, pts, icon) AS (VALUES
 ('Gardien de la Citadelle','Citadel Keeper','Va visiter la Citadelle de Vauban et fais le tour de ses remparts.','Visit Vauban''s Citadel and walk around its ramparts.','Citadelle de Lille',50.6412,3.0446,400,80,'🏰'),
 ('Cœur de la Grand''Place','Heart of the Grand''Place','Rends-toi sur la Grand''Place, au pied de la colonne de la Déesse.','Go to the Grand''Place, at the foot of the Goddess column.','Grand''Place de Lille',50.6369,3.0634,150,40,'🗽'),
 ('Bouquiniste de la Vieille Bourse','Vieille Bourse Bookworm','Flâne dans la cour de la Vieille Bourse entre les bouquinistes et les joueurs d''échecs.','Stroll through the Vieille Bourse courtyard among booksellers and chess players.','Vieille Bourse',50.6372,3.0645,100,40,'📚'),
 ('Sommet du Beffroi','Belfry Summit','Monte au Beffroi de l''Hôtel de Ville, classé à l''UNESCO.','Climb the UNESCO-listed Town Hall Belfry.','Beffroi de l''Hôtel de Ville',50.6307,3.0706,150,70,'🔔'),
 ('Amateur des Beaux-Arts','Fine Arts Lover','Visite le Palais des Beaux-Arts, l''un des plus grands musées de France.','Visit the Palais des Beaux-Arts, one of France''s largest museums.','Palais des Beaux-Arts',50.6307,3.0626,150,60,'🖼️'),
 ('Lumière de la Treille','Light of the Treille','Découvre la cathédrale Notre-Dame-de-la-Treille et sa façade translucide.','Discover Notre-Dame-de-la-Treille cathedral and its translucent facade.','Cathédrale Notre-Dame-de-la-Treille',50.6403,3.0623,120,50,'⛪'),
 ('Flâneur de Wazemmes','Wazemmes Wanderer','Plonge dans l''ambiance du marché de Wazemmes (mardi, jeudi ou dimanche matin).','Soak up the Wazemmes market vibe (Tuesday, Thursday or Sunday morning).','Marché de Wazemmes',50.6263,3.0495,250,50,'🧺'),
 ('Secrets de l''Hospice','Secrets of the Hospice','Visite le musée de l''Hospice Comtesse dans le Vieux-Lille.','Visit the Hospice Comtesse museum in Old Lille.','Hospice Comtesse',50.6410,3.0645,100,50,'🗝️'),
 ('Pavés du Vieux-Lille','Old Lille Cobbles','Remonte la rue de la Monnaie et ses façades flamandes.','Walk up rue de la Monnaie and its Flemish facades.','Rue de la Monnaie',50.6392,3.0637,120,30,'🧱'),
 ('Gaufre chez Méert','Méert Waffle','Goûte la célèbre gaufre fourrée à la vanille chez Méert.','Taste the famous vanilla-filled waffle at Méert.','Méert, rue Esquermoise',50.6378,3.0638,60,40,'🧇'),
 ('Pause au Jardin Vauban','Vauban Garden Break','Fais une pause dans le Jardin Vauban, jardin à l''anglaise au bord de la Deûle.','Take a break in the Jardin Vauban by the Deûle river.','Jardin Vauban',50.6356,3.0484,200,30,'🌳'),
 ('Passage de la Porte de Paris','Porte de Paris Passage','Passe sous l''arc de triomphe de la Porte de Paris.','Walk under the Porte de Paris triumphal arch.','Porte de Paris',50.6313,3.0691,100,30,'🏛️'),
 ('Friche Saint-Sauveur','Saint-Sauveur Spot','Découvre la gare Saint-Sauveur, ancienne gare devenue lieu culturel.','Discover Gare Saint-Sauveur, a former station turned cultural venue.','Gare Saint-Sauveur',50.6291,3.0725,150,40,'🎭'),
 ('Maison du Général','The General''s House','Visite la maison natale de Charles de Gaulle.','Visit the birthplace of Charles de Gaulle.','Maison natale de Charles de Gaulle',50.6420,3.0622,80,50,'🎖️'),
 ('Plongeon à La Piscine','Dive into La Piscine','Visite La Piscine de Roubaix, musée installé dans une piscine Art déco.','Visit La Piscine in Roubaix, a museum inside an Art Deco pool.','La Piscine, Roubaix',50.6897,3.1646,150,70,'🏊'),
 ('Art brut au LaM','Outsider Art at LaM','Explore le LaM et son parc de sculptures à Villeneuve-d''Ascq.','Explore LaM and its sculpture park in Villeneuve-d''Ascq.','LaM, Villeneuve-d''Ascq',50.6395,3.1497,250,70,'🗿')
)
INSERT INTO public.gam_badges (category_id, name_fr, name_en, description_fr, description_en, reward_fr, reward_en, points, icon, verification_method, target_lat, target_lng, target_radius_m, target_place, active, needs_translation)
SELECT cat.id, v.name_fr, v.name_en, v.d_fr, v.d_en, v.pts || ' pts', v.pts || ' pts', v.pts, v.icon, 'geo', v.lat, v.lng, v.r, v.place, true, false
FROM v, cat
WHERE NOT EXISTS (SELECT 1 FROM public.gam_badges b WHERE b.name_fr = v.name_fr);

WITH v(slug, name_fr, name_en, d_fr, d_en, pts, method) AS (VALUES
 ('technologie','Nomade connecté','Connected nomad','Travaille une journée depuis un espace de coworking à l''étranger.','Work a full day from a coworking space abroad.',60,'photo'),
 ('technologie','Zéro papier','Paperless','Voyage avec tous tes billets et documents en version numérique.','Travel with all your tickets and documents digitally.',40,'manual'),
 ('technologie','Traducteur de poche','Pocket translator','Commande un repas en utilisant uniquement une appli de traduction.','Order a meal using only a translation app.',40,'manual'),
 ('technologie','Musée du futur','Museum of the future','Visite un musée des sciences ou de l''innovation.','Visit a science or innovation museum.',60,'ticket'),
 ('technologie','Carte hors ligne','Offline map','Explore une ville une journée entière avec une carte hors ligne seulement.','Explore a city for a whole day using only an offline map.',50,'manual'),
 ('gastronomie','Roi du street food','Street food king','Goûte 3 spécialités de rue dans un même marché.','Try 3 street food specialties in the same market.',50,'photo'),
 ('gastronomie','Cours de cuisine','Cooking class','Participe à un cours de cuisine locale.','Take a local cooking class.',80,'ticket'),
 ('gastronomie','Petit-déj local','Local breakfast','Prends un petit-déjeuner 100 % typique du pays.','Have a 100% local breakfast.',30,'photo'),
 ('gastronomie','Au marché avant 9 h','Market before 9am','Fais tes courses dans un marché local avant 9 h.','Shop at a local market before 9am.',40,'photo'),
 ('romantique','Coucher de soleil','Sunset spot','Admire un coucher de soleil depuis un point de vue en hauteur.','Watch a sunset from a high viewpoint.',40,'photo'),
 ('romantique','Carte postale d''amour','Love postcard','Envoie une carte postale écrite à la main à quelqu''un que tu aimes.','Send a handwritten postcard to someone you love.',30,'manual'),
 ('romantique','Dîner surprise','Surprise dinner','Organise un dîner surprise dans un lieu insolite.','Plan a surprise dinner in an unusual place.',60,'photo'),
 ('travail','Réunion au bout du monde','Meeting from afar','Participe à une visio depuis un lieu avec une vue incroyable.','Join a video call from a place with an amazing view.',40,'photo'),
 ('travail','Réseau local','Local network','Assiste à un événement professionnel ou meetup à l''étranger.','Attend a professional event or meetup abroad.',70,'ticket'),
 ('travail','Bleisure','Bleisure','Prolonge un déplacement pro d''au moins un jour pour visiter.','Extend a business trip by at least one day to explore.',50,'manual'),
 ('famille','Chasse au trésor','Treasure hunt','Organise une chasse au trésor en famille dans une ville.','Run a family treasure hunt in a city.',60,'photo'),
 ('famille','Petit guide','Little guide','Laisse un enfant choisir et guider une activité de la journée.','Let a child pick and lead one activity of the day.',40,'manual'),
 ('famille','Zoo ou aquarium','Zoo or aquarium','Visite un zoo, un aquarium ou une ferme pédagogique.','Visit a zoo, aquarium or educational farm.',50,'ticket'),
 ('eco','Train plutôt qu''avion','Train over plane','Fais un trajet en train au lieu de l''avion.','Take the train instead of flying.',70,'ticket'),
 ('eco','Zéro plastique','Zero plastic','Passe une journée sans acheter de plastique jetable.','Spend a day without buying single-use plastic.',40,'manual'),
 ('eco','Nettoyage de plage','Beach clean-up','Participe à un ramassage de déchets.','Join a litter clean-up.',80,'photo'),
 ('eco','À vélo','By bike','Visite une ville entière à vélo.','Explore a whole city by bike.',50,'photo')
)
INSERT INTO public.gam_badges (category_id, name_fr, name_en, description_fr, description_en, reward_fr, reward_en, points, verification_method, active, needs_translation)
SELECT c.id, v.name_fr, v.name_en, v.d_fr, v.d_en, v.pts || ' pts', v.pts || ' pts', v.pts, v.method::gam_verification_method, true, false
FROM v JOIN public.gam_categories c ON c.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM public.gam_badges b WHERE b.name_fr = v.name_fr);