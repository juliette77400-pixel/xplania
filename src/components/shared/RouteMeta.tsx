import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const BASE = "https://xplania.app";

type Meta = { fr: [string, string]; en: [string, string] };

// Unique title (<60 chars) + description (50–160 chars) per public route.
const META: Record<string, Meta> = {
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
  "/about": {
    fr: ["À propos de Xplania", "Découvre l'histoire de Xplania, l'assistant de voyage IA qui rend chaque voyage plus personnel."],
    en: ["About Xplania", "Learn the story behind Xplania, the AI travel assistant that makes every trip more personal."],
  },
  "/trust": {
    fr: ["Sécurité et confiance — Xplania", "Comment Xplania protège tes données, ta vie privée et la fiabilité des informations de voyage."],
    en: ["Trust & security — Xplania", "How Xplania protects your data, your privacy and the reliability of travel information."],
  },
};
META["/blog/how-to-plan-a-trip-with-ai"] = {
  fr: ["Comment planifier un voyage avec l'IA — Xplania", "Guide étape par étape pour planifier un voyage avec l'IA : itinéraire, budget, visa, valise et découvertes locales."],
  en: ["How to plan a trip with AI — Xplania", "Step-by-step guide to plan a trip with an AI travel planner: itinerary, budget, visa, packing and local tips."],
};
META["/a-propos"] = META["/about"];
META["/securite"] = META["/trust"];

// Pages that manage their own head (public shares, legal).
const SELF_MANAGED = [/^\/carnet\/public\//, /^\/suivi\/public\//, /^\/legal/, /^\/mentions-legales/, /^\/legal-notice/, /^\/politique-de-confidentialite/, /^\/privacy-policy/, /^\/conditions-utilisation/, /^\/terms-of-use/];

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export default function RouteMeta() {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (SELF_MANAGED.some((r) => r.test(pathname))) return;
    const url = `${BASE}${pathname === "/" ? "/" : pathname.replace(/\/$/, "")}`;
    setCanonical(url);
    setMeta("property", "og:url", url);
    const m = META[pathname];
    if (!m) return;
    const [title, description] = i18n.language?.startsWith("en") ? m.en : m.fr;
    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
  }, [pathname, i18n.language]);

  return null;
}
