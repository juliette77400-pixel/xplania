// Single source of truth for per-route <title>/description used both at
// runtime (src/components/shared/RouteMeta.tsx) and at build time
// (vite.config.ts static HTML generation plugin).

export type Meta = { fr: [string, string]; en: [string, string] };

// Unique title (<60 chars) + description (50–160 chars) per public route.
export const META: Record<string, Meta> = {
  "/": {
    fr: ["Xplania — Découvre ton ADN Voyageur", "Réponds au quiz ADN Voyageur et reçois des voyages, budgets et guides pensés pour ta façon de voyager."],
    en: ["Xplania — Discover your Travel DNA", "Take the Travel DNA quiz and get trips, budgets and guides built around the way you like to travel."],
  },
  "/home": {
    fr: ["Xplania — Ton assistant de voyage IA", "Planifie ton voyage avec l'IA : itinéraire, budget, visa, valise et idées locales, au même endroit."],
    en: ["Xplania — Your AI travel assistant", "Plan your trip with AI: itinerary, budget, visa, packing and local ideas, all in one place."],
  },
  "/dashboard": {
    fr: ["Créer mon voyage avec l'IA — Xplania", "Indique tes dates, ton budget et tes envies : Xplania génère un itinéraire complet et localisé."],
    en: ["Create my trip with AI — Xplania", "Enter your dates, budget and wishes: Xplania builds a complete, local itinerary for you."],
  },
  "/guide-budget": {
    fr: ["Guide budget voyage — Xplania", "Estime ton budget voyage en 3 scénarios, suis tes dépenses et découvre des bons plans locaux."],
    en: ["Travel budget guide — Xplania", "Estimate your travel budget in 3 scenarios, track expenses and find local money-saving deals."],
  },
  "/guide-visa": {
    fr: ["Visa et formalités de voyage — Xplania", "Visa, passeport, vaccins et sécurité : les formalités essentielles pour partir en toute sérénité."],
    en: ["Visa & travel requirements — Xplania", "Visa, passport, vaccines and safety: the key requirements to travel with peace of mind."],
  },
  "/guide-valise": {
    fr: ["Guide valise intelligent — Xplania", "Une checklist de valise adaptée à ta destination, à la météo et à tes activités, vérifiée par l'IA."],
    en: ["Smart packing guide — Xplania", "A packing checklist tailored to your destination, weather and activities, checked by AI."],
  },
  "/offres": {
    fr: ["Offres et tarifs Premium — Xplania", "Découvre les packs Premium Xplania et débloque toutes les fonctionnalités de voyage IA."],
    en: ["Premium plans & pricing — Xplania", "Explore Xplania Premium packs and unlock every AI travel feature."],
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
    fr: ["À propos de Xplania", "Découvre l'histoire de Xplania, l'assistant de voyage IA qui rend chaque voyage plus personnel."],
    en: ["About Xplania", "Learn the story behind Xplania, the AI travel assistant that makes every trip more personal."],
  },
  "/securite": {
    fr: ["Sécurité et confiance — Xplania", "Comment Xplania protège tes données, ta vie privée et la fiabilité des informations de voyage."],
    en: ["Trust & security — Xplania", "How Xplania protects your data, your privacy and the reliability of travel information."],
  },
  "/xplania-vs-chatgpt": {
    fr: ["Xplania vs ChatGPT — l'alternative IA pour organiser ton voyage", "Xplania vs ChatGPT : itinéraires, budget, valise et suivi de voyage générés et organisés pour toi, sans copier-coller de prompts."],
    en: ["Xplania vs ChatGPT — the AI alternative to plan your trip", "Xplania vs ChatGPT: itineraries, budget, packing and trip tracking generated and organized for you, no prompt copy-pasting."],
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
