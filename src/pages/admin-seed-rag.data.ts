// 16 seed RAG chunks (placeholders réalistes ~150-250 mots).
// Structure figée — Juliette remplacera le contenu par des textes validés
// (offices de tourisme, Wikivoyage, UNESCO) sans changer la clé.

export interface SeedChunk {
  chunk_key: string;
  destination_slug: string;
  title: string;
  category: "general" | "culture" | "food" | "nomad" | "visa" | "nature" | "practical";
  locale: "fr" | "en";
  content: string;
}

export const SEED_CHUNKS: SeedChunk[] = [
  // ============= KYOTO =============
  {
    chunk_key: "kyoto-general-fr",
    destination_slug: "kyoto",
    title: "Kyoto — vue d'ensemble",
    category: "general",
    locale: "fr",
    content:
      "Kyoto, ancienne capitale impériale du Japon pendant plus de mille ans, incarne l'âme spirituelle et esthétique du pays. Contrairement à Tokyo, tournée vers l'avenir néon, Kyoto préserve un rythme intérieur : ruelles pavées, murs en terre ocre, sanctuaires shinto et temples bouddhistes cohabitent avec des cafés design et des ateliers d'artisans. La ville compte plus de 1 600 temples et 400 sanctuaires, dont 17 sites classés UNESCO. Les saisons y sont vécues comme des événements collectifs : cerisiers fin mars-début avril, érables écarlates fin novembre, contemplation de la lune en septembre. La topographie encaissée entre trois collines crée un microclimat étouffant en été (juillet-août) et vif en hiver. Kyoto se marche : chaque quartier révèle une atmosphère distincte, du silence zen d'Arashiyama à l'effervescence gastronomique de Pontocho. Base idéale pour rayonner vers Nara, Osaka et la mer intérieure de Seto. Compte au moins 4 jours pour effleurer l'essentiel, une semaine pour comprendre.",
  },
  {
    chunk_key: "kyoto-neighborhoods-fr",
    destination_slug: "kyoto",
    title: "Kyoto — quartiers et lieux emblématiques",
    category: "culture",
    locale: "fr",
    content:
      "Fushimi Inari Taisha, célèbre pour ses milliers de torii vermillon grimpant la montagne, se visite idéalement avant 8h ou après 18h pour éviter les foules ; la boucle complète dure 2 à 3 heures. Gion, le quartier historique des geishas, respire au crépuscule autour de Hanamikoji-dori : maisons de thé en bois, apparitions furtives de maiko en route vers un ozashiki. Arashiyama, à l'ouest, aligne la forêt de bambous Sagano, le pont Togetsukyo et le temple Tenryu-ji ; grimper jusqu'au parc aux singes d'Iwatayama offre un panorama à 360°. Le Kinkaku-ji (Pavillon d'or) et le Ginkaku-ji (Pavillon d'argent) restent incontournables mais bondés en journée. Pour l'authenticité, préférez le Chemin de la philosophie au printemps, le quartier d'Ohara au nord (1h en bus) et Higashiyama tôt le matin. Nishiki Market, halle couverte de 400 mètres, réunit 130 échoppes de spécialités locales : yuba, tsukemono, matcha soft. Kiyomizu-dera, temple perché sur pilotis, se prolonge par les ruelles marchandes Sannenzaka et Ninenzaka.",
  },
  {
    chunk_key: "kyoto-culture-fr",
    destination_slug: "kyoto",
    title: "Kyoto — culture et traditions",
    category: "culture",
    locale: "fr",
    content:
      "La cérémonie du thé (chanoyu) est plus qu'un rituel : c'est une chorégraphie codifiée depuis le XVIe siècle par Sen no Rikyu, réunissant hôte et invités autour du wa (harmonie), kei (respect), sei (pureté) et jaku (tranquillité). Plusieurs maisons de thé (Camellia, En, Ju-an) proposent des sessions de 45 min en anglais. Le Zen se pratique dans les temples Rinzai (Daitoku-ji, Nanzen-ji) et Soto ; certaines écoles ouvrent leurs zazen matinaux au public. Les geishas et leurs apprenties maiko incarnent un système d'apprentissage exigeant de danse, shamisen, jeux de conversation et cérémonie du thé ; les spectacles publics comme Miyako Odori (avril) ou Gion Odori (novembre) permettent de découvrir cet art sans intermédiaire douteux. L'artisanat kyotoïte reste vivant : soies Nishijin, laques Kyo-nuri, poteries Kiyomizu-yaki, sabres, éventails en bambou. Les fêtes rythment l'année : Aoi Matsuri (mai), Gion Matsuri (juillet, un mois entier), Jidai Matsuri (octobre).",
  },
  {
    chunk_key: "kyoto-practical-fr",
    destination_slug: "kyoto",
    title: "Kyoto — conseils pratiques",
    category: "practical",
    locale: "fr",
    content:
      "Meilleure période : fin mars à mi-avril (sakura, mais très cher et bondé), mai (climat doux, verdure), octobre à début décembre (érables). Éviter juillet-août (chaleur humide 35°C+) sauf pour Gion Matsuri. Budget moyen backpacker : 60-80€/jour ; confort : 120-180€/jour ; luxe (ryokan avec kaiseki) : 400€+/jour. Transport : le bus municipal couvre le mieux la ville (pass 24h à 700 yens) ; le métro (2 lignes) est limité mais rapide. Le Kansai Thru Pass (2 ou 3 jours) inclut Osaka et Nara. Louer un vélo est idéal pour le nord-est (Higashiyama, Chemin de la philosophie). Le JR Pass n'est pas indispensable si vous restez au Kansai ; il devient rentable dès un aller-retour Tokyo-Kyoto. Wifi gratuit dans les cafés et métros ; carte SIM prépayée ou pocket wifi à récupérer à l'aéroport. Réservez restaurants gastronomiques (kaiseki, kappo) 2 à 3 semaines à l'avance ; nombreux acceptent uniquement le liquide.",
  },
  // ============= TOKYO =============
  {
    chunk_key: "tokyo-general-fr",
    destination_slug: "tokyo",
    title: "Tokyo — vue d'ensemble",
    category: "general",
    locale: "fr",
    content:
      "Tokyo, capitale de 14 millions d'habitants (37 millions pour la région métropolitaine), s'assume comme la plus grande ville du monde et une des plus organisées. Contrairement à l'imaginaire du chaos néon, la métropole se lit comme une constellation de villages hyper-spécialisés reliés par le maillage JR Yamanote. Contraste permanent : un jardin impérial silencieux jouxte Marunouchi, un temple bouddhiste vieux d'un millénaire côtoie une tour de 55 étages, une machinerie de vending machines fait face à un maître ramen tenant boutique depuis 40 ans. Tokyo cultive un raffinement discret : le meilleur sushi se sert dans un comptoir de 8 places, le meilleur café coule dans une échoppe cachée en sous-sol. La ville se relève des séismes et de la guerre, chaque quartier reconstruit à sa manière. Ne cherchez pas un centre : Tokyo en a une dizaine, chacun avec sa culture (mode à Harajuku, business à Shinjuku, tradition à Asakusa, otaku à Akihabara, luxe à Ginza). Comptez 5 à 7 jours pour survoler, un mois pour commencer à saisir.",
  },
  {
    chunk_key: "tokyo-neighborhoods-fr",
    destination_slug: "tokyo",
    title: "Tokyo — quartiers emblématiques",
    category: "culture",
    locale: "fr",
    content:
      "Shibuya incarne le Tokyo moderne : le carrefour scramble, la statue du chien Hachiko, Shibuya Sky pour un panorama à 230 m, les ruelles de Nonbei Yokocho pour un yakitori d'après-boulot. Shinjuku, hub gigantesque, abrite le Golden Gai (200 micro-bars dans 6 ruelles), Kabukicho (vie nocturne), le sanctuaire Meiji-jingu voisin et le parc Shinjuku Gyoen (l'un des plus beaux du Japon). Asakusa préserve le Tokyo d'Edo : temple Senso-ji (le plus vieux de la ville), rue commerçante Nakamise, rickshaws et vue sur la Tokyo Skytree. Akihabara concentre l'univers otaku (jeux vidéo rétro, manga, anime, maid cafés, électronique) mais aussi les meilleurs curry-houses de la ville. Ginza est le quartier du luxe (Chanel, Dior, dépanneurs de mochi centenaires, kabuki-za). À découvrir hors des sentiers : Yanaka (vieux Tokyo échappé aux bombes, cimetière apaisant), Shimokitazawa (fripes, cafés indé, musique live), Nakameguro (rivière bordée de cerisiers, boutiques design), Kagurazaka (ruelles françaises et geishas discrètes).",
  },
  {
    chunk_key: "tokyo-food-nightlife-fr",
    destination_slug: "tokyo",
    title: "Tokyo — gastronomie et vie nocturne",
    category: "food",
    locale: "fr",
    content:
      "Tokyo compte plus d'étoiles Michelin qu'aucune autre ville au monde (200+). Le sushi de comptoir se pratique à Sukiyabashi Jiro (impossible à réserver sans conciergerie), Sushi Saito, ou plus accessible chez Sushi Dai à Toyosu (queue à 5h du matin). Ramen : chaque quartier a sa spécialité — Ichiran pour l'expérience solitaire, Afuri pour un bouillon yuzu, Tsuta pour le seul ramen étoilé Michelin. Izakaya : le rituel du repas partagé arrose-toi-toi ; testez Torikizoku (chaîne bon marché) ou les ruelles de Yurakucho sous les voies ferrées. Kaiseki gastronomique : Ryugin, Ishikawa, Kohaku (réserver 3 mois à l'avance). Vie nocturne : Golden Gai pour l'ambiance, Roppongi pour la nuit internationale, Nishi-Azabu pour le clubbing haut de gamme (Womb, ageHa). Cocktails : Bar High Five, Bar Benfiddich, Star Bar — véritables temples du bartending. Cafés spécialisés : Fuglen (Tomigaya), Blue Bottle (Nakameguro), Toranomon Coffee. Convenience stores (7-Eleven, Lawson, FamilyMart) ouverts 24/7 vendent une nourriture étonnamment excellente.",
  },
  {
    chunk_key: "tokyo-practical-fr",
    destination_slug: "tokyo",
    title: "Tokyo — conseils pratiques",
    category: "practical",
    locale: "fr",
    content:
      "Meilleure période : fin mars à début avril (sakura, très cher), mai-juin (avant la saison des pluies), octobre-novembre (climat idéal, momiji). Éviter août (35°C humide, typhons) et le Nouvel An (tout ferme). Budget backpacker : 70-90€/jour (dortoirs, ramen, transport local) ; confort : 150-200€/jour ; luxe : 400€+ (ryokan-hôtel, gastronomie étoilée). Transport : la carte Suica ou Pasmo (rechargeable) fonctionne dans métro, bus, JR, convenience stores. La ligne JR Yamanote fait le tour du centre en 60 min et dessert 90% des lieux touristiques. Taxis coûteux (départ 500 yens, 400 yens/km) mais impeccables. Marchez : c'est la façon de saisir Tokyo. Wifi : moins présent qu'attendu ; louez un pocket wifi (5-10€/jour) ou une SIM prépayée à l'aéroport (Haneda/Narita). Argent : cartes acceptées partout dans les grandes chaînes, liquide indispensable pour izakaya de quartier, temples, taxis anciens. Ne pas donner de pourboire (culturellement rejeté). Politesse : silence en train, ne pas manger en marchant, respect strict des files d'attente.",
  },
  // ============= LISBONNE =============
  {
    chunk_key: "lisbon-general-fr",
    destination_slug: "lisbon",
    title: "Lisbonne — vue d'ensemble",
    category: "general",
    locale: "fr",
    content:
      "Lisbonne, capitale du Portugal étalée sur sept collines face à l'estuaire du Tage, cultive une mélancolie lumineuse unique en Europe. La ville a explosé sur la scène internationale dans les années 2015-2020 grâce à son visa D8 nomade, ses prix encore abordables (à l'échelle occidentale), sa scène gastronomique renouvelée et sa lumière atlantique dorée qui inspire les photographes. L'atmosphère est méditerranéenne mais teintée d'une gravité propre : la saudade, ce désir nostalgique d'un ailleurs ou d'un passé, imprègne le fado, l'architecture azulejo et l'urbanisme. Le tremblement de terre de 1755 a effacé la Lisbonne médiévale ; le marquis de Pombal a reconstruit la Baixa selon un plan orthogonal moderne. Autour subsistent des quartiers labyrinthiques (Alfama, Mouraria) échappés au séisme. Le climat est doux toute l'année : rarement en dessous de 10°C l'hiver, dépassant rarement 35°C l'été. Base parfaite pour rayonner vers Sintra, Cascais, Setúbal ou l'Alentejo. Comptez 3 à 4 jours pour la ville, une semaine pour la région.",
  },
  {
    chunk_key: "lisbon-neighborhoods-fr",
    destination_slug: "lisbon",
    title: "Lisbonne — quartiers emblématiques",
    category: "culture",
    locale: "fr",
    content:
      "Alfama, le plus ancien quartier, échappé au tremblement de terre : ruelles pentues, lignes de linge, chapelles cachées et tavernes de fado. Le tram 28 le traverse ; grimpez à pied jusqu'au Miradouro Santa Luzia et au château São Jorge. Bairro Alto vit deux vies : silencieux en journée, saturé de bars et de musique le soir. Chiado, en contrebas, réunit les cafés historiques (A Brasileira, Bertrand), boutiques mode et librairies. Baixa, reconstruit après 1755, s'organise en damier autour de la Praça do Comércio et de la Rua Augusta. Belém, à 10 minutes de tram, concentre l'héritage des Grandes Découvertes : tour de Belém, Monastère des Jerónimos (UNESCO), Padrão dos Descobrimentos, MAAT (musée art-architecture-tech) et l'iconique Pastéis de Belém. Príncipe Real et Estrela abritent la Lisbonne bourgeoise-bohème : concept stores, brunchs, jardins. LX Factory, ancien complexe industriel reconverti à Alcântara, réunit librairie Ler Devagar, restaurants, galeries et marché dominical. Pour l'authenticité populaire : Graça, Mouraria (berceau du fado) et Marvila (scène art contemporain émergente).",
  },
  {
    chunk_key: "lisbon-culture-fr",
    destination_slug: "lisbon",
    title: "Lisbonne — culture locale",
    category: "culture",
    locale: "fr",
    content:
      "Le fado, chant mélancolique inscrit à l'UNESCO en 2011, incarne la saudade portugaise : voix suppliante accompagnée de guitare portugaise à 12 cordes et de viola. Deux écoles : le fado de Coimbra (universitaire, masculin) et le fado de Lisbonne (populaire, souvent féminin). Écoutez le vrai fado vadio (amateur, spontané) dans les tavernes de Mouraria ou Alfama plutôt que dans les shows touristiques. Les azulejos, carreaux de céramique émaillée d'inspiration mudéjare, tapissent les façades depuis le XVIe siècle ; visitez le Museu Nacional do Azulejo pour l'histoire complète. La gastronomie lisboète repose sur le bacalhau (morue, 365 recettes selon la légende), les sardines grillées (juin-septembre, fêtes de Santo António), le pastéis de nata (le vrai est à Belém, croute feuilletée cannelle-citron), la soupe caldo verde et les cataplanas de fruits de mer. La scène gastronomique moderne : Time Out Market Ribeira réunit les meilleurs chefs de la ville sous un même toit ; à côté fleurissent les tavernas néo-portugaises comme Taberna da Rua das Flores, A Cevicheria ou Loco (2 étoiles Michelin).",
  },
  {
    chunk_key: "lisbon-nomad-fr",
    destination_slug: "lisbon",
    title: "Lisbonne — conseils pratiques et digital nomad",
    category: "nomad",
    locale: "fr",
    content:
      "Meilleure période : mars-mai et septembre-octobre (climat idéal, moins de foule). Juin-août : soleil garanti mais chaud, prix élevés, foule internationale. Hiver doux (10-15°C), pluies possibles. Coût de la vie : plus cher qu'il y a 5 ans mais encore raisonnable — loyer T2 centre-ville 1400-2000€/mois, café 1-2€, repas de midi 10-15€, gastronomie 40-70€. Le visa D8 (nomade digital) permet aux travailleurs distants non-européens de résider jusqu'à 5 ans avec un revenu minimum de 3480€/mois ; démarche relativement fluide via consulat portugais dans le pays d'origine. Le régime fiscal NHR a été aboli fin 2024 mais remplacé par l'IFICI (20% flat sur revenus qualifiés). Coworkings : Second Home Lisboa, Cowork Central, LX Factory, Selina — abondants. Transport : métro (4 lignes, pas cher), tram (28 et 15 iconiques), Uber/Bolt très abordables. Aéroport à 20 min du centre en métro. Sécurité : ville sûre, attention aux pickpockets dans le tram 28 et à Baixa. Anglais parlé partout, apprendre 5 mots portugais suffit pour être adoré des locaux.",
  },
  // ============= MARRAKECH =============
  {
    chunk_key: "marrakech-general-fr",
    destination_slug: "marrakech",
    title: "Marrakech — vue d'ensemble",
    category: "general",
    locale: "fr",
    content:
      "Marrakech, la ville rouge, fondée au XIe siècle par les Almoravides, se dresse comme une porte entre l'Afrique subsaharienne et la Méditerranée. Contrastes permanents : la médina piétonne (UNESCO) et ses souks médiévaux jouxtent Gueliz, quartier européen créé par les Français dans les années 1910, tandis qu'Hivernage aligne palaces et clubs contemporains. À 40 min au sud, les premiers contreforts du Haut Atlas offrent randonnées, villages berbères et sommets à 4 000 m. À 2h à l'est commencent les portes du désert (Zagora, Merzouga). Marrakech se vit comme un choc sensoriel : chants du muezzin, tanneurs, épices, feuille d'or, thé à la menthe versé de haut. Le climat est semi-aride : hiver doux (5-20°C), printemps parfait, été brûlant (40°C+ juillet-août), automne agréable. La ville se replie autour de riads (maisons traditionnelles à patio) transformés en hôtels de charme. Comptez 3 à 4 jours pour la médina, une semaine avec excursions dans l'Atlas ou vers Essaouira.",
  },
  {
    chunk_key: "marrakech-landmarks-fr",
    destination_slug: "marrakech",
    title: "Marrakech — lieux emblématiques",
    category: "culture",
    locale: "fr",
    content:
      "Jemaa el-Fna, place mythique inscrite à l'UNESCO, se métamorphose au fil de la journée : porteurs d'eau et vendeurs de jus d'orange le matin, charmeurs de serpents et conteurs l'après-midi, immense restaurant en plein air à la tombée de la nuit avec musiciens gnaoua et derviches. Grimper sur une terrasse (Café de France, Café des Épices) au coucher du soleil est un rituel. La Koutoubia, mosquée aux 77 mètres de minaret du XIIe siècle, sert de repère visuel dans toute la ville. Les souks se déploient au nord de Jemaa el-Fna en un labyrinthe organisé par corporations : Semmarine (bijoux et tapis), Attarine (parfums et épices), Cherratine (cuir), Kimakhine (musique), tanneurs de Bab Debbagh. Le Palais Bahia (XIXe) et le Palais Badi (XVIe, en ruines majestueuses) racontent le raffinement royal. La Medersa Ben Youssef, ancienne université coranique, est un joyau d'architecture morisque. Le Jardin Majorelle et son musée Yves Saint Laurent voisin, dans Gueliz, offrent une pause bleu Majorelle en plein cœur de la ville. Autres jardins reposants : la Ménara, l'Agdal (à quelques km).",
  },
  {
    chunk_key: "marrakech-crafts-fr",
    destination_slug: "marrakech",
    title: "Marrakech — culture et artisanat",
    category: "culture",
    locale: "fr",
    content:
      "Marrakech reste l'un des derniers grands centres d'artisanat vivant du bassin méditerranéen. Les tanneries de Bab Debbagh, encore actives, teignent les peaux dans des cuves colorées à l'ancienne (indigo, safran, henné, chaux) — visite gratuite officieuse contre feuille de menthe pour l'odeur. Le zellige, mosaïque de terre cuite émaillée coupée à la main, tapisse fontaines, murs et mausolées ; Fès en reste la capitale mais Marrakech en abrite des maîtres. Le tadelakt, enduit chaux à la pierre polie, décore hammams et riads d'un rendu satiné. La feuille d'or de Kanazawa a son écho à Marrakech dans les livres de prières enluminés. La cuisine artisanale : tajine cuit au brasero, couscous du vendredi, pastilla au pigeon, harira du ramadan, thé à la menthe préparé en cascade. La cérémonie du hammam, transmise de génération en génération, se pratique en quartier populaire (500 dirhams pour l'expérience complète avec gommage kessa et savon noir) ou en spa haut de gamme (Farnatchi, La Mamounia). Musiques vivantes : gnaoua (transe soufie afro-marocaine, festival annuel à Essaouira), chaabi, andalou.",
  },
  {
    chunk_key: "marrakech-practical-fr",
    destination_slug: "marrakech",
    title: "Marrakech — conseils pratiques",
    category: "practical",
    locale: "fr",
    content:
      "Meilleure période : mars-mai et octobre-novembre (25-28°C, ciel dégagé). Décembre-février : doux mais nuits froides (5°C), parfait pour éviter la foule. Juin-septembre : dépasse régulièrement 40°C, à éviter sauf accès piscine impératif. Ramadan : rythme ralenti la journée, magique le soir mais restaurants médina fermés au déjeuner. Budget backpacker : 25-40€/jour ; confort riad de charme : 80-150€/jour ; luxe palace : 300€+/jour. Négocier dans les souks est un jeu obligatoire — divisez le premier prix par 3-4, souriez, apprenez « shokran, la » (merci, non), quittez le magasin si nécessaire (le vendeur vous rappellera avec un vrai prix). Sécurité : ville globalement sûre, tension possible avec les rabatteurs de riads ou faux guides ; ne suivez jamais quelqu'un qui vous propose un « endroit spécial » ou une « fête berbère ». Payez taxis au compteur (petits taxis beiges) ou négociez avant (grands taxis). Femmes seules : tenue couvrante conseillée, éviter la médina après 22h. Pourboires attendus (5-10%). Change : dirham non convertible à l'étranger, retirez sur place. Anglais peu parlé dans la médina, français très pratiqué.",
  },
];
