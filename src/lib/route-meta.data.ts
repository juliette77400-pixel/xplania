// Single source of truth for per-route <title>/description used both at
// runtime (src/components/shared/RouteMeta.tsx) and at build time
// (vite.config.ts static HTML generation plugin).

export type Meta = { fr: [string, string]; en: [string, string] };

// Unique title (<60 chars) + description (50–160 chars) per public route.
export const META: Record<string, Meta> = {
  "/": {
    fr: ["Xplania | Prépare ton Erasmus ou ton stage à l'étranger", "Prépare ton Erasmus ou ton stage à l'étranger sans stress : démarches, budget, logement, valise et culture locale réunis au même endroit, avec des conseils adaptés à ta destination."],
    en: ["Xplania | Prepare your Erasmus or internship abroad", "Prepare your Erasmus or internship abroad without the stress: paperwork, budget, housing, packing and local culture in one place, with advice tailored to your destination."],
  },
  "/home": {
    fr: ["Xplania | Prépare ton Erasmus ou ton stage à l'étranger", "Prépare ton Erasmus ou ton stage à l'étranger sans stress : démarches, budget, logement, valise et culture locale réunis au même endroit, avec des conseils adaptés à ta destination."],
    en: ["Xplania | Prepare your Erasmus or internship abroad", "Prepare your Erasmus or internship abroad without the stress: paperwork, budget, housing, packing and local culture in one place, with advice tailored to your destination."],
  },
  "/dashboard": {
    fr: ["Créer mon voyage — Xplania", "Renseigne ta destination, tes dates et ton type de séjour pour préparer ton départ : budget, visa, valise, culture et logement."],
    en: ["Create my trip — Xplania", "Enter your destination, dates and type of stay to prepare your departure: budget, visa, packing, culture and housing."],
  },
  "/guide-budget": {
    fr: ["Guide budget avant le départ — Xplania", "Estime ton budget de séjour à l'étranger en 3 scénarios et prévois tes dépenses avant de partir."],
    en: ["Pre-departure budget guide — Xplania", "Estimate your budget for a stay abroad in 3 scenarios and plan your expenses before you leave."],
  },
  "/guide-visa": {
    fr: ["Visa et formalités de voyage — Xplania", "Visa, passeport, vaccins et sécurité : les formalités essentielles pour partir en toute sérénité."],
    en: ["Visa & travel requirements — Xplania", "Visa, passport, vaccines and safety: the key requirements to travel with peace of mind."],
  },
  "/guide-valise": {
    fr: ["Guide valise intelligent — Xplania", "Une checklist de valise adaptée à ta destination, à la météo et à ton type de séjour, vérifiée par l'IA."],
    en: ["Smart packing guide — Xplania", "A packing checklist tailored to your destination, weather and type of stay, checked by AI."],
  },
  "/offres": {
    fr: ["Offres et packs — Xplania", "Teste gratuitement Budget, Visa, Valise, Guide interculturel et Logement, puis choisis le pack Administratif ou Interculturel."],
    en: ["Offers & packs — Xplania", "Test Budget, Visa, Packing, the Intercultural guide and Housing for free, then pick the Admin or Intercultural pack."],
  },
  "/mood": {
    fr: ["Mood Explorer — Xplania", "Choisis ton humeur du moment et reçois des lieux à découvrir qui te correspondent vraiment."],
    en: ["Mood Explorer — Xplania", "Pick your current mood and get places to discover that truly match how you feel."],
  },
  "/discover": {
    fr: ["Découvrir autour de moi — Xplania", "Les meilleurs lieux autour de toi : restaurants, culture, nature et pépites locales sur une carte."],
    en: ["Discover nearby — Xplania", "The best places around you: food, culture, nature and local gems on one map."],
  },
  "/destinations": {
    fr: ["Destinations faites pour toi — Xplania", "Des destinations choisies selon ton ADN Voyageur : culture, nature, budget et pépites peu touristiques."],
    en: ["Destinations made for you — Xplania", "Destinations picked from your Traveler DNA: culture, nature, budget and off-the-beaten-path gems."],
  },
  "/a-propos": {
    fr: ["À propos de Xplania", "L'histoire de Xplania : réunir budget, visa, valise, culture et logement pour préparer un départ à l'étranger sans stress."],
    en: ["About Xplania", "The story of Xplania: bringing budget, visa, packing, culture and housing together to prepare a stay abroad stress-free."],
  },
  "/ecoles": {
    fr: ["Xplania pour les écoles", "Un pilote pour aider vos étudiants à préparer leur mobilité : budget, visa, valise, codes culturels et logement."],
    en: ["Xplania for schools", "A pilot to help your students prepare their mobility: budget, visa, packing, cultural codes and housing."],
  },
  "/securite": {
    fr: ["Sécurité et confiance — Xplania", "Comment Xplania protège tes données, ta vie privée et la fiabilité des informations de voyage."],
    en: ["Trust & security — Xplania", "How Xplania protects your data, your privacy and the reliability of travel information."],
  },
  "/guide-culture": {
    fr: ["Guide d'immersion culturelle — Xplania", "Les codes culturels de ton pays d'accueil : tenue, gastronomie, gestes, salutations, avec mises en situation et mini-quiz."],
    en: ["Cultural immersion guide — Xplania", "The cultural codes of your host country: dress, food, gestures, greetings, with real-life situations and a mini-quiz."],
  },
  "/guide-logement": {
    fr: ["Assistant Logement — Xplania", "Prépare ton logement à l'étranger : où chercher, comparer tes options, éviter les arnaques et préparer ton installation."],
    en: ["Housing assistant — Xplania", "Get your housing abroad ready: where to look, compare your options, avoid scams and prepare your move-in."],
  },
  "/xplania-vs-chatgpt": {
    fr: ["Xplania vs ChatGPT — préparer son voyage à l'étranger", "Xplania vs ChatGPT : budget, visa, valise, codes culturels et logement organisés autour de ton voyage, sans copier-coller de prompts."],
    en: ["Xplania vs ChatGPT — preparing a trip abroad", "Xplania vs ChatGPT: budget, visa, packing, cultural codes and housing organised around your trip, no prompt copy-pasting."],
  },
  "/preparation": {
    fr: ["Prépare ton départ en 2 minutes — Xplania", "Réponds à un court questionnaire pour préparer ton Erasmus ou ton stage à l'étranger : budget, visa, valise et culture, adaptés à ton projet."],
    en: ["Prepare your departure in 2 minutes — Xplania", "Answer a short questionnaire to prepare your Erasmus or internship abroad: budget, visa, packing and culture tailored to your project."],
  },
};
META["/blog/how-to-plan-a-trip-with-ai"] = {
  fr: ["Comment planifier un voyage avec l'IA — Xplania", "Guide étape par étape pour planifier un voyage avec l'IA : itinéraire, budget, visa, valise et découvertes locales."],
  en: ["How to plan a trip with AI — Xplania", "Step-by-step guide to plan a trip with an AI travel planner: itinerary, budget, visa, packing and local tips."],
};
// Public country guides (src/data/destination-pages.ts).
META["/preparer"] = {
  fr: ["Préparer son Erasmus ou son stage : guides par pays — Xplania", "Formalités, santé, budget, logement et codes culturels pour préparer ton Erasmus ou ton stage à l'étranger, pays par pays."],
  en: ["Preparing your Erasmus or internship: country guides — Xplania", "Paperwork, health, budget, housing and cultural codes to prepare your Erasmus or internship abroad, country by country."],
};
META["/preparer/espagne"] = {
  fr: ["Préparer son Erasmus ou son stage en Espagne — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Espagne, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Spain — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Spain, with official links."],
};
META["/preparer/royaume-uni"] = {
  fr: ["Préparer son Erasmus ou son stage au Royaume-Uni — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage au Royaume-Uni, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in the UK — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in the UK, with official links."],
};
META["/preparer/pays-bas"] = {
  fr: ["Préparer son Erasmus ou son stage aux Pays-Bas — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage aux Pays-Bas, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in the Netherlands — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in the Netherlands, with official links."],
};
META["/preparer/pologne"] = {
  fr: ["Préparer son Erasmus ou son stage en Pologne — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Pologne, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Poland — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Poland, with official links."],
};
META["/preparer/etats-unis"] = {
  fr: ["Préparer son Erasmus ou son stage aux États-Unis — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage aux États-Unis, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in the United States — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in the United States, with official links."],
};
META["/preparer/australie"] = {
  fr: ["Préparer son Erasmus ou son stage en Australie — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Australie, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Australia — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Australia, with official links."],
};
META["/preparer/japon"] = {
  fr: ["Préparer son Erasmus ou son stage au Japon — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage au Japon, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Japan — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Japan, with official links."],
};
META["/preparer/chine"] = {
  fr: ["Préparer son Erasmus ou son stage en Chine — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Chine, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in China — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in China, with official links."],
};
META["/preparer/mexique"] = {
  fr: ["Préparer son Erasmus ou son stage au Mexique — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage au Mexique, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Mexico — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Mexico, with official links."],
};
META["/preparer/bresil"] = {
  fr: ["Préparer son Erasmus ou son stage au Brésil — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage au Brésil, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Brazil — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Brazil, with official links."],
};
META["/preparer/indonesie"] = {
  fr: ["Préparer son Erasmus ou son stage en Indonésie — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Indonésie, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Indonesia — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Indonesia, with official links."],
};
META["/preparer/coree-du-sud"] = {
  fr: ["Préparer son Erasmus ou son stage en Corée du Sud — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Corée du Sud, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in South Korea — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in South Korea, with official links."],
};
META["/preparer/nouvelle-zelande"] = {
  fr: ["Préparer son Erasmus ou son stage en Nouvelle-Zélande — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Nouvelle-Zélande, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in New Zealand — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in New Zealand, with official links."],
};
META["/preparer/portugal"] = {
  fr: ["Préparer son Erasmus ou son stage au Portugal — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage au Portugal, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Portugal — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Portugal, with official links."],
};
META["/preparer/chili"] = {
  fr: ["Préparer son Erasmus ou son stage au Chili — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage au Chili, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Chile — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Chile, with official links."],
};
META["/preparer/argentine"] = {
  fr: ["Préparer son Erasmus ou son stage en Argentine — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Argentine, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Argentina — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Argentina, with official links."],
};
META["/preparer/danemark"] = {
  fr: ["Préparer son Erasmus ou son stage au Danemark — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage au Danemark, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Denmark — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Denmark, with official links."],
};
META["/preparer/suede"] = {
  fr: ["Préparer son Erasmus ou son stage en Suède — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Suède, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Sweden — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Sweden, with official links."],
};
META["/preparer/italie"] = {
  fr: ["Préparer son Erasmus ou son stage en Italie — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Italie, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Italy — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Italy, with official links."],
};
META["/preparer/hongrie"] = {
  fr: ["Préparer son Erasmus ou son stage en Hongrie — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Hongrie, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Hungary — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Hungary, with official links."],
};
META["/preparer/suisse"] = {
  fr: ["Préparer son Erasmus ou son stage en Suisse — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Suisse, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Switzerland — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Switzerland, with official links."],
};
META["/preparer/norvege"] = {
  fr: ["Préparer son Erasmus ou son stage en Norvège — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Norvège, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Norway — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Norway, with official links."],
};
META["/preparer/grece"] = {
  fr: ["Préparer son Erasmus ou son stage en Grèce — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Grèce, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Greece — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Greece, with official links."],
};
META["/preparer/afrique-du-sud"] = {
  fr: ["Préparer son Erasmus ou son stage en Afrique du Sud — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Afrique du Sud, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in South Africa — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in South Africa, with official links."],
};
META["/preparer/autriche"] = {
  fr: ["Préparer son Erasmus ou son stage en Autriche — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Autriche, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Austria — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Austria, with official links."],
};
META["/preparer/bulgarie"] = {
  fr: ["Préparer son Erasmus ou son stage en Bulgarie — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Bulgarie, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Bulgaria — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Bulgaria, with official links."],
};
META["/preparer/irlande"] = {
  fr: ["Préparer son Erasmus ou son stage en Irlande — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Irlande, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Ireland — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Ireland, with official links."],
};
META["/preparer/perou"] = {
  fr: ["Préparer son Erasmus ou son stage au Pérou — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage au Pérou, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in Peru — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in Peru, with official links."],
};
META["/preparer/inde"] = {
  fr: ["Préparer son Erasmus ou son stage en Inde — Xplania", "Visa, santé, budget, logement et codes culturels : ce qu'il faut préparer avant ton Erasmus ou ton stage en Inde, avec les liens officiels."],
  en: ["Preparing your Erasmus or internship in India — Xplania", "Visa, health, budget, housing and cultural codes: what to prepare before your Erasmus or internship in India, with official links."],
};
// Pages that manage their own head (public shares, legal).
export const SELF_MANAGED = [/^\/carnet\/public\//, /^\/suivi\/public\//, /^\/legal/, /^\/mentions-legales/, /^\/politique-de-confidentialite/, /^\/conditions-utilisation/];

// Routes that must never be indexed by search engines (auth flows, no content
// value for SEO). RouteMeta sets a robots noindex meta tag at runtime for
// these, and the build-time prerender plugin bakes it into their static HTML.
// Valise and Logement need an account: crawlers would only reach the sign-in page.
export const NOINDEX_ROUTES = ["/auth", "/reset-password", "/guide-valise", "/guide-logement"];
