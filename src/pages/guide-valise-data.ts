// Static checklist data and mode/transport helpers for GuideValise.
// Extracted from src/pages/GuideValise.tsx to keep the page component focused on UI.

import type { LuggageMode } from "@/components/valise/LuggageModes";
import type { TransportMode } from "@/components/valise/TransportSelector";
import type { ChecklistItem } from "@/components/valise/ChecklistSection";
import i18n from "@/i18n";
import { activityChecklist, type ValiseActivity } from "@/lib/valise-activities";

const isEn = () => i18n.language?.startsWith("en");

const baseCategoriesFr: Record<string, ChecklistItem[]> = {
  "Vêtements essentiels": [
    { name: "T-shirts (3-4)", description: "Couleurs neutres, respirants", checked: true },
    { name: "Pull léger", description: "Pour les soirées fraîches", checked: true },
    { name: "Pantalon confortable", description: "Idéal pour marcher", checked: true },
    { name: "Short", description: "Pour les journées chaudes", checked: false },
    { name: "Veste légère", description: "Adaptée au climat", checked: true },
    { name: "Sous-vêtements (×5)", description: "Prévoir lavage", checked: true },
    { name: "Pyjama", description: "Confortable", checked: false },
  ],
  "Accessoires & Protection": [
    { name: "Lunettes de soleil", description: "Protection UV", checked: true },
    { name: "Casquette / chapeau", description: "Pour les visites en plein jour", checked: true },
    { name: "Parapluie compact", description: "En cas de pluie", checked: false },
  ],
  "Technologie": [
    { name: "Chargeurs & câbles", description: "Téléphone + appareils", checked: true },
    { name: "Batterie externe", description: "10000mAh minimum", checked: true },
    { name: "Adaptateur électrique", description: "Vérifie le type de prise du pays", checked: true },
    { name: "Écouteurs / AirPods", description: "Pour les trajets", checked: true },
  ],
  "Documents importants": [
    { name: "Passeport", description: "Vérifier la validité (6 mois+)", checked: true },
    { name: "Carte d'identité", description: "Toujours utile", checked: true },
    { name: "Assurances voyage", description: "Copies numériques + papier", checked: false },
    { name: "Billets / réservations", description: "Imprimés + numériques", checked: true },
  ],
  "Santé & Pharmacie": [
    { name: "Mini trousse à pharmacie", description: "Médicaments de base", checked: true },
    { name: "Crème solaire SPF 30+", description: "Protection solaire", checked: true },
    { name: "Anti-moustiques", description: "Selon la destination", checked: false },
    { name: "Gel hydroalcoolique", description: "Format voyage", checked: true },
  ],
  "Hygiène & Soin": [
    { name: "Produits d'hygiène", description: "Format voyage (<100ml)", checked: true },
    { name: "Brosse à dents", description: "+ dentifrice mini", checked: true },
    { name: "Déodorant", description: "Format voyage", checked: true },
  ],
  "Sécurité": [
    { name: "Cadenas TSA", description: "Pour la valise", checked: false },
    { name: "Pochette anti-RFID", description: "Protection cartes bancaires", checked: false },
  ],
};

const baseCategoriesEn: Record<string, ChecklistItem[]> = {
  "Essential clothing": [
    { name: "T-shirts (3-4)", description: "Neutral colours, breathable", checked: true },
    { name: "Light sweater", description: "For cool evenings", checked: true },
    { name: "Comfortable trousers", description: "Ideal for walking", checked: true },
    { name: "Shorts", description: "For warm days", checked: false },
    { name: "Light jacket", description: "Adapted to the climate", checked: true },
    { name: "Underwear (×5)", description: "Allow for laundry", checked: true },
    { name: "Pyjamas", description: "Comfortable", checked: false },
  ],
  "Accessories & Protection": [
    { name: "Sunglasses", description: "UV protection", checked: true },
    { name: "Cap / hat", description: "For daytime sightseeing", checked: true },
    { name: "Compact umbrella", description: "In case of rain", checked: false },
  ],
  "Technology": [
    { name: "Chargers & cables", description: "Phone + devices", checked: true },
    { name: "Power bank", description: "10,000mAh minimum", checked: true },
    { name: "Plug adapter", description: "Check the country's plug type", checked: true },
    { name: "Earphones / AirPods", description: "For the journeys", checked: true },
  ],
  "Important documents": [
    { name: "Passport", description: "Check validity (6+ months)", checked: true },
    { name: "ID card", description: "Always useful", checked: true },
    { name: "Travel insurance", description: "Digital + paper copies", checked: false },
    { name: "Tickets / bookings", description: "Printed + digital", checked: true },
  ],
  "Health & Pharmacy": [
    { name: "Mini first-aid kit", description: "Basic medication", checked: true },
    { name: "SPF 30+ sunscreen", description: "Sun protection", checked: true },
    { name: "Insect repellent", description: "Depending on the destination", checked: false },
    { name: "Hand sanitiser", description: "Travel size", checked: true },
  ],
  "Hygiene & Care": [
    { name: "Toiletries", description: "Travel size (<100ml)", checked: true },
    { name: "Toothbrush", description: "+ mini toothpaste", checked: true },
    { name: "Deodorant", description: "Travel size", checked: true },
  ],
  "Security": [
    { name: "TSA lock", description: "For the suitcase", checked: false },
    { name: "Anti-RFID pouch", description: "Bank card protection", checked: false },
  ],
};

export const baseCategories = new Proxy({} as Record<string, ChecklistItem[]>, {
  get: (_t, prop) => (isEn() ? baseCategoriesEn : baseCategoriesFr)[prop as string],
  ownKeys: () => Reflect.ownKeys(isEn() ? baseCategoriesEn : baseCategoriesFr),
  getOwnPropertyDescriptor: (_t, prop) =>
    Object.getOwnPropertyDescriptor(isEn() ? baseCategoriesEn : baseCategoriesFr, prop as string),
});

const modeExtrasFr: Record<LuggageMode, Record<string, ChecklistItem[]>> = {
  erasmus: {
    "Séjour long (Erasmus) 🎓": [
      { name: "Attestation d'inscription / Learning Agreement", description: "Imprimée + PDF sur ton téléphone", checked: false },
      { name: "Carte européenne d'assurance maladie ou assurance santé", description: "Valable toute la durée du séjour", checked: false },
      { name: "Photos d'identité (×4)", description: "Pour la carte étudiante, le transport…", checked: false },
      { name: "Carte bancaire sans frais à l'étranger", description: "+ une deuxième carte de secours", checked: false },
      { name: "Médicaments habituels pour 1 à 3 mois", description: "Avec l'ordonnance (en anglais si possible)", checked: false },
      { name: "Vêtements pour deux saisons", description: "Superposables : t-shirts, pull, veste", checked: false },
      { name: "Drap housse + serviette pour les premiers jours", description: "Le logement n'en fournit pas toujours", checked: false },
      { name: "Multiprise", description: "Une seule prise adaptée suffit alors", checked: false },
    ],
  },
  stage: {
    "Stage professionnel 💼": [
      { name: "Tenues professionnelles (2-3)", description: "Selon le code vestimentaire de l'entreprise", checked: false },
      { name: "Chaussures de ville confortables", description: "Pour toute une journée", checked: false },
      { name: "Ordinateur portable + chargeur", description: "Vérifie s'il est fourni par l'entreprise", checked: false },
      { name: "Contrat ou attestation de stage", description: "Imprimé + PDF", checked: false },
      { name: "CV et pièce d'identité", description: "Pour les démarches d'arrivée", checked: false },
      { name: "Carnet et stylo", description: "Pour les premières réunions", checked: false },
    ],
  },
  cabine: {
    "Bagage cabine uniquement 🎒": [
      { name: "Valise aux dimensions de ta compagnie", description: "Souvent 55 × 40 × 20 cm : vérifie sur ton billet", checked: false },
      { name: "Pèse-bagage", description: "Poids cabine souvent limité à 7-10 kg", checked: false },
      { name: "Liquides ≤ 100 ml dans un sac transparent", description: "1 litre au total", checked: false },
      { name: "Vêtements combinables", description: "Une garde-robe réduite qui va ensemble", checked: false },
      { name: "Lessive voyage", description: "Pour laver sur place plutôt que d'emporter plus", checked: false },
    ],
  },
  soute: {
    "Bagage en soute 🧳": [
      { name: "Étiquette nom + téléphone + adresse sur place", description: "À l'intérieur et à l'extérieur", checked: false },
      { name: "Pèse-bagage", description: "Franchise souvent 23 kg : vérifie sur ton billet", checked: false },
      { name: "Cadenas TSA", description: "", checked: false },
      { name: "Objets de valeur et médicaments en cabine", description: "Jamais en soute", checked: false },
      { name: "Une tenue de rechange en cabine", description: "Au cas où la valise arrive en retard", checked: false },
    ],
  },
  sport: {
    "Équipement sportif ⚽": [
      { name: "Ton équipement de sport", description: "Raquette, crampons, tenue…", checked: false },
      { name: "Housse de transport", description: "Vérifie le tarif bagage spécial de ta compagnie", checked: false },
      { name: "Chaussures de sport", description: "", checked: false },
      { name: "Gourde", description: "", checked: false },
      { name: "Assurance couvrant ce sport", description: "Certaines excluent les sports à risque", checked: false },
    ],
  },
};

const modeExtrasEn: Record<LuggageMode, Record<string, ChecklistItem[]>> = {
  erasmus: {
    "Long stay (Erasmus) 🎓": [
      { name: "Enrolment certificate / Learning Agreement", description: "Printed + PDF on your phone", checked: false },
      { name: "European Health Insurance Card or health insurance", description: "Valid for the whole stay", checked: false },
      { name: "ID photos (×4)", description: "For student card, transport pass…", checked: false },
      { name: "Bank card with no foreign fees", description: "+ a second backup card", checked: false },
      { name: "Usual medication for 1-3 months", description: "With the prescription (in English if possible)", checked: false },
      { name: "Clothes for two seasons", description: "Layers: t-shirts, jumper, jacket", checked: false },
      { name: "Fitted sheet + towel for the first days", description: "Housing doesn't always provide them", checked: false },
      { name: "Power strip", description: "Then one adapter is enough", checked: false },
    ],
  },
  stage: {
    "Internship 💼": [
      { name: "Work outfits (2-3)", description: "Depending on the company dress code", checked: false },
      { name: "Comfortable smart shoes", description: "For a full day", checked: false },
      { name: "Laptop + charger", description: "Check whether the company provides one", checked: false },
      { name: "Internship contract or certificate", description: "Printed + PDF", checked: false },
      { name: "CV and ID", description: "For arrival paperwork", checked: false },
      { name: "Notebook and pen", description: "For the first meetings", checked: false },
    ],
  },
  cabine: {
    "Cabin bag only 🎒": [
      { name: "Suitcase matching your airline's size", description: "Often 55 × 40 × 20 cm: check your ticket", checked: false },
      { name: "Luggage scale", description: "Cabin weight often limited to 7-10 kg", checked: false },
      { name: "Liquids ≤ 100 ml in a clear bag", description: "1 litre in total", checked: false },
      { name: "Mix-and-match clothes", description: "A small wardrobe that goes together", checked: false },
      { name: "Travel detergent", description: "Wash there rather than pack more", checked: false },
    ],
  },
  soute: {
    "Checked luggage 🧳": [
      { name: "Tag with name + phone + address there", description: "Inside and outside", checked: false },
      { name: "Luggage scale", description: "Allowance often 23 kg: check your ticket", checked: false },
      { name: "TSA lock", description: "", checked: false },
      { name: "Valuables and medication in the cabin", description: "Never in the hold", checked: false },
      { name: "A change of clothes in the cabin", description: "In case your bag arrives late", checked: false },
    ],
  },
  sport: {
    "Sports equipment ⚽": [
      { name: "Your sports gear", description: "Racket, boots, kit…", checked: false },
      { name: "Travel cover", description: "Check your airline's special baggage fee", checked: false },
      { name: "Sports shoes", description: "", checked: false },
      { name: "Water bottle", description: "", checked: false },
      { name: "Insurance covering this sport", description: "Some exclude risky sports", checked: false },
    ],
  },
};

export const modeExtras = new Proxy({} as Record<LuggageMode, Record<string, ChecklistItem[]>>, {
  get: (_t, prop) => (isEn() ? modeExtrasEn : modeExtrasFr)[prop as LuggageMode],
});

const transportExtrasFr: Record<TransportMode, Record<string, ChecklistItem[]>> = {
  avion: {
    "Spécial Avion ✈️": [
      { name: "Liquides en flacons <100ml", description: "Sac transparent zip", checked: true },
      { name: "Coussin cervical", description: "Pour long-courrier", checked: false },
      { name: "Boules quies / masque", description: "Sommeil en vol", checked: true },
      { name: "Pièce d'identité accessible", description: "Pour contrôles", checked: true },
      { name: "Power bank <100Wh", description: "Obligatoire en cabine", checked: true },
    ],
  },
  train: {
    "Spécial Train 🚆": [
      { name: "Billet imprimé / e-billet", description: "Présenter au contrôleur", checked: true },
      { name: "Snacks & gourde", description: "Voiture-bar souvent chère", checked: false },
      { name: "Livre / podcast", description: "Pour le trajet", checked: false },
    ],
  },
  voiture: {
    "Spécial Voiture 🚗": [
      { name: "Permis & carte grise", description: "Documents obligatoires", checked: true },
      { name: "Gilet jaune & triangle", description: "Obligatoire UE", checked: true },
      { name: "Support téléphone GPS", description: "Navigation mains libres", checked: true },
      { name: "Câble chargeur 12V", description: "USB-C + Lightning", checked: true },
      { name: "Vignette / péage badge", description: "Selon pays traversés", checked: false },
      { name: "Glacière / snacks", description: "Pause sur la route", checked: false },
    ],
  },
  bateau: {
    "Spécial Bateau 🚢": [
      { name: "Anti mal de mer", description: "Cocculine ou Mercalm", checked: true },
      { name: "Coupe-vent imperméable", description: "Vent en mer", checked: true },
      { name: "Chaussures antidérapantes", description: "Ponts mouillés", checked: true },
      { name: "Crème solaire SPF 50", description: "Réverbération de l'eau", checked: true },
      { name: "Sac étanche", description: "Protection téléphone/papiers", checked: false },
    ],
  },
  velo: {
    "Spécial Vélo 🚲": [
      { name: "Casque", description: "Obligatoire pour les mineurs dans plusieurs pays, conseillé pour tous", checked: false },
      { name: "Éclairage avant et arrière", description: "Obligatoire la nuit dans la plupart des pays européens", checked: false },
      { name: "Gilet ou bandes réfléchissantes", description: "Pour être vu·e le soir", checked: false },
      { name: "Antivol solide", description: "Les vols de vélos sont fréquents en ville", checked: false },
      { name: "Sacoches ou sac étanche", description: "Pour transporter tes affaires sous la pluie", checked: false },
      { name: "Kit de réparation + pompe", description: "Rustines, démonte-pneus", checked: false },
      { name: "Veste de pluie légère", description: "Se range dans une sacoche", checked: false },
    ],
  },
};

const transportExtrasEn: Record<TransportMode, Record<string, ChecklistItem[]>> = {
  avion: {
    "Flight special ✈️": [
      { name: "Liquids in <100ml bottles", description: "Clear zip bag", checked: true },
      { name: "Neck pillow", description: "For long-haul flights", checked: false },
      { name: "Earplugs / mask", description: "In-flight sleep", checked: true },
      { name: "Accessible ID", description: "For security checks", checked: true },
      { name: "Power bank <100Wh", description: "Mandatory in cabin", checked: true },
    ],
  },
  train: {
    "Train special 🚆": [
      { name: "Printed ticket / e-ticket", description: "Show to the conductor", checked: true },
      { name: "Snacks & water bottle", description: "Buffet car is often expensive", checked: false },
      { name: "Book / podcast", description: "For the journey", checked: false },
    ],
  },
  voiture: {
    "Car special 🚗": [
      { name: "Licence & registration", description: "Mandatory documents", checked: true },
      { name: "Hi-vis vest & warning triangle", description: "Mandatory in the EU", checked: true },
      { name: "GPS phone mount", description: "Hands-free navigation", checked: true },
      { name: "12V charger cable", description: "USB-C + Lightning", checked: true },
      { name: "Toll pass / vignette", description: "Depending on countries crossed", checked: false },
      { name: "Cooler / snacks", description: "For roadside breaks", checked: false },
    ],
  },
  bateau: {
    "Boat special 🚢": [
      { name: "Seasickness remedy", description: "Motion sickness tablets", checked: true },
      { name: "Waterproof windbreaker", description: "Wind at sea", checked: true },
      { name: "Non-slip shoes", description: "Wet decks", checked: true },
      { name: "SPF 50 sunscreen", description: "Water glare", checked: true },
      { name: "Waterproof bag", description: "Phone/papers protection", checked: false },
    ],
  },
  velo: {
    "Bike special 🚲": [
      { name: "Helmet", description: "Mandatory for minors in several countries, advised for everyone", checked: false },
      { name: "Front and rear lights", description: "Mandatory at night in most European countries", checked: false },
      { name: "Reflective vest or bands", description: "To be seen in the evening", checked: false },
      { name: "Sturdy lock", description: "Bike theft is common in cities", checked: false },
      { name: "Panniers or waterproof bag", description: "To carry your things in the rain", checked: false },
      { name: "Repair kit + pump", description: "Patches, tyre levers", checked: false },
      { name: "Light rain jacket", description: "Fits in a pannier", checked: false },
    ],
  },
};

export const transportExtras = new Proxy({} as Record<TransportMode, Record<string, ChecklistItem[]>>, {
  get: (_t, prop) => (isEn() ? transportExtrasEn : transportExtrasFr)[prop as TransportMode],
});

export function buildCategories(
  mode: LuggageMode,
  transport: TransportMode,
  activities: ValiseActivity[] = [],
  activityOther = "",
): Record<string, ChecklistItem[]> {
  const base = isEn() ? baseCategoriesEn : baseCategoriesFr;
  const modeSet = (isEn() ? modeExtrasEn : modeExtrasFr)[mode] || {};
  const transportSet = (isEn() ? transportExtrasEn : transportExtrasFr)[transport] || {};
  const activitySet = activityChecklist(activities, activityOther, !!isEn());
  const all = { ...base, ...modeSet, ...transportSet, ...activitySet };
  // Nothing is ticked before the student packs it.
  return Object.fromEntries(Object.entries(all).map(([k, items]) => [k, items.map((i) => ({ ...i, checked: false }))]));
}
