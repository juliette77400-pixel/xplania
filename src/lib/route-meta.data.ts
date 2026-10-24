// Single source of truth for per-route <title>/description used both at
// runtime (src/components/shared/RouteMeta.tsx) and at build time
// (vite.config.ts static HTML generation plugin).

export type Meta = { fr: [string, string]; en: [string, string] };

// Unique title (<60 chars) + description (50–160 chars) per public route.
export const META: Record<string, Meta> = {
  "/": {
    fr: ["Xplania — Prépare ton voyage à l'étranger sans soucis", "Organise ton voyage à l'étranger en amont : budget, visa, valise et codes culturels réunis au même endroit. Gratuit pendant la bêta."],
    en: ["Xplania — Prepare your trip abroad without the hassle", "Organise your trip abroad ahead of time: budget, visa, packing and cultural codes in one place. Free during the beta."],
  },
  "/home": {
    fr: ["Xplania — Prépare ton départ à l'étranger", "Budget, visa, valise et culture : les 4 préparatifs essentiels avant ton départ, réunis au même endroit."],
    en: ["Xplania — Prepare to go abroad", "Budget, visa, packing and culture: the 4 essential preparations before you leave, in one place."],
  },
  "/dashboard": {
    fr: ["Créer mon voyage — Xplania", "Renseigne ta destination, tes dates et ton type de séjour pour préparer ton départ : budget, visa, valise et culture."],
    en: ["Create my trip — Xplania", "Enter your destination, dates and type of stay to prepare your departure: budget, visa, packing and culture."],
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
    fr: ["Offres et packs — Xplania", "Teste gratuitement Budget, Visa, Valise et Guide interculturel, puis choisis le pack Administratif ou Interculturel."],
    en: ["Offers & packs — Xplania", "Test Budget, Visa, Packing and the Intercultural guide for free, then pick the Admin or Intercultural pack."],
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
    fr: ["À propos de Xplania", "L'histoire de Xplania : réunir budget, visa, valise et culture pour préparer un départ à l'étranger sans stress."],
    en: ["About Xplania", "The story of Xplania: bringing budget, visa, packing and culture together to prepare a stay abroad stress-free."],
  },
  "/ecoles": {
    fr: ["Xplania pour les écoles", "Un pilote pour aider vos étudiants à préparer leur mobilité : budget, visa, valise et codes culturels."],
    en: ["Xplania for schools", "A pilot to help your students prepare their mobility: budget, visa, packing and cultural codes."],
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
    fr: ["Xplania vs ChatGPT — préparer son voyage à l'étranger", "Xplania vs ChatGPT : budget, visa, valise et codes culturels organisés autour de ton voyage, sans copier-coller de prompts."],
    en: ["Xplania vs ChatGPT — preparing a trip abroad", "Xplania vs ChatGPT: budget, visa, packing and cultural codes organised around your trip, no prompt copy-pasting."],
  },
};
META["/blog/how-to-plan-a-trip-with-ai"] = {
  fr: ["Comment planifier un voyage avec l'IA — Xplania", "Guide étape par étape pour planifier un voyage avec l'IA : itinéraire, budget, visa, valise et découvertes locales."],
  en: ["How to plan a trip with AI — Xplania", "Step-by-step guide to plan a trip with an AI travel planner: itinerary, budget, visa, packing and local tips."],
};
// Pages that manage their own head (public shares, legal).
export const SELF_MANAGED = [/^\/carnet\/public\//, /^\/suivi\/public\//, /^\/legal/, /^\/mentions-legales/, /^\/politique-de-confidentialite/, /^\/conditions-utilisation/];

// Routes that must never be indexed by search engines (auth flows, no content
// value for SEO). RouteMeta sets a robots noindex meta tag at runtime for
// these, and the build-time prerender plugin bakes it into their static HTML.
export const NOINDEX_ROUTES = ["/auth", "/reset-password", "/guide-valise"];
