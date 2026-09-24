// Static checklist data and mode/transport helpers for GuideValise.
// Extracted from src/pages/GuideValise.tsx to keep the page component focused on UI.

import type { LuggageMode } from "@/components/valise/LuggageModes";
import type { TransportMode } from "@/components/valise/TransportSelector";
import type { ChecklistItem } from "@/components/valise/ChecklistSection";
import i18n from "@/i18n";

const isEn = () => i18n.language?.startsWith("en");

const baseCategoriesFr: Record<string, ChecklistItem[]> = {
  "Vêtements essentiels": [
    { name: "T-shirts (3-4)", description: "Couleurs neutres, respirants", checked: true },
    { name: "Pull léger", description: "Pour les soirées fraîches", checked: true },
    { name: "Pantalon confortable", description: "Idéal pour marcher", checked: true },
    { name: "Short", description: "Pour les journées chaudes", checked: false },
    { name: "Tenue de soirée", description: "Élégante mais décontractée", checked: false },
    { name: "Veste légère", description: "Adaptée au climat", checked: true },
    { name: "Sous-vêtements (×5)", description: "Prévoir lavage", checked: true },
    { name: "Pyjama", description: "Confortable", checked: false },
  ],
  "Accessoires & Protection": [
    { name: "Lunettes de soleil", description: "Protection UV", checked: true },
    { name: "Casquette / chapeau", description: "Pour les visites en plein jour", checked: true },
    { name: "Écharpe légère", description: "Style et confort", checked: false },
    { name: "Parapluie compact", description: "En cas de pluie", checked: false },
  ],
  "Technologie": [
    { name: "Chargeurs & câbles", description: "Téléphone + appareils", checked: true },
    { name: "Batterie externe", description: "10000mAh minimum", checked: true },
    { name: "Adaptateur universel", description: "Pour la destination", checked: true },
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
    { name: "Evening outfit", description: "Elegant but casual", checked: false },
    { name: "Light jacket", description: "Adapted to the climate", checked: true },
    { name: "Underwear (×5)", description: "Allow for laundry", checked: true },
    { name: "Pyjamas", description: "Comfortable", checked: false },
  ],
  "Accessories & Protection": [
    { name: "Sunglasses", description: "UV protection", checked: true },
    { name: "Cap / hat", description: "For daytime sightseeing", checked: true },
    { name: "Light scarf", description: "Style and comfort", checked: false },
    { name: "Compact umbrella", description: "In case of rain", checked: false },
  ],
  "Technology": [
    { name: "Chargers & cables", description: "Phone + devices", checked: true },
    { name: "Power bank", description: "10,000mAh minimum", checked: true },
    { name: "Universal adapter", description: "For the destination", checked: true },
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
  minimaliste: {},
  confort: {
    "Confort supplémentaire": [
      { name: "Oreiller de voyage", description: "Mémoire de forme", checked: true },
      { name: "Masque de sommeil", description: "Qualité soie", checked: true },
      { name: "Bouchons d'oreilles", description: "Anti-bruit", checked: true },
    ],
  },
  stylée: {
    "Style & Apparence": [
      { name: "Tenues coordonnées (×3)", description: "Looks complets", checked: true },
      { name: "Chaussures élégantes", description: "Polyvalentes", checked: true },
      { name: "Trousse maquillage", description: "Essentiels beauté", checked: false },
    ],
  },
  aventure: {
    "Équipement aventure": [
      { name: "Couteau suisse", description: "Multi-usage (en soute)", checked: true },
      { name: "Lampe frontale", description: "Rechargeable USB", checked: true },
      { name: "Filtre à eau portable", description: "Indispensable trek", checked: false },
    ],
  },
  business: {
    "Business": [
      { name: "Costume / tailleur", description: "Dans housse", checked: true },
      { name: "Chaussures formelles", description: "Cirées", checked: true },
      { name: "Ordinateur portable", description: "+ chargeur + souris", checked: true },
      { name: "Cartes de visite", description: "En quantité", checked: true },
    ],
  },
  photo: {
    "Matériel photo / vidéo": [
      { name: "Appareil photo", description: "Boîtier + objectifs", checked: true },
      { name: "Trépied carbone", description: "Léger et stable", checked: true },
      { name: "Batteries (×4)", description: "Chargées", checked: true },
      { name: "Cartes SD (256Go)", description: "×2 minimum", checked: true },
    ],
  },
  randonnée: {
    "Équipement randonnée": [
      { name: "Chaussures de trek", description: "Rodées", checked: true },
      { name: "Sac à dos 30-50L", description: "Avec ceinture ventrale", checked: true },
      { name: "Gourde / Camelbak", description: "2L minimum", checked: true },
      { name: "Poncho pluie", description: "Couvre aussi le sac", checked: true },
    ],
  },
  plage: {
    "Essentiels plage": [
      { name: "Maillots de bain (×2)", description: "Pour alterner", checked: true },
      { name: "Paréo / serviette XL", description: "Multi-usage", checked: true },
      { name: "Tongs / sandales", description: "Résistantes à l'eau", checked: true },
      { name: "Crème solaire SPF 50", description: "Waterproof", checked: true },
      { name: "Sac étanche", description: "Pour téléphone + clés", checked: true },
    ],
  },
  roadtrip: {
    "Essentiels road trip": [
      { name: "Glacière pliable", description: "Pour snacks et boissons", checked: true },
      { name: "Support téléphone", description: "Pour la navigation", checked: true },
      { name: "Câble chargeur voiture", description: "USB-C + Lightning", checked: true },
      { name: "Kit premier secours auto", description: "Obligatoire dans certains pays", checked: true },
    ],
  },
  urbain: {
    "Essentiels city break 🏙️": [
      { name: "Sneakers confortables", description: "Stylées et marche longue", checked: true },
      { name: "Sac à bandoulière anti-vol", description: "Sécurise tes affaires en ville", checked: true },
      { name: "Veste polyvalente", description: "Jour & soir", checked: true },
      { name: "Carte de transport / app", description: "Métro, bus, vélos", checked: false },
    ],
  },
  luxe: {
    "Essentiels luxe 💎": [
      { name: "Valise rigide premium", description: "Cabine + soute", checked: true },
      { name: "Tenue de soirée", description: "Smoking / robe cocktail", checked: true },
      { name: "Trousse de toilette cuir", description: "Soins haut de gamme", checked: true },
      { name: "Bijoux discrets", description: "Coffre-fort hôtel conseillé", checked: false },
    ],
  },
};

const modeExtrasEn: Record<LuggageMode, Record<string, ChecklistItem[]>> = {
  minimaliste: {},
  confort: {
    "Extra comfort": [
      { name: "Travel pillow", description: "Memory foam", checked: true },
      { name: "Sleep mask", description: "Silk quality", checked: true },
      { name: "Earplugs", description: "Noise cancelling", checked: true },
    ],
  },
  stylée: {
    "Style & Look": [
      { name: "Coordinated outfits (×3)", description: "Complete looks", checked: true },
      { name: "Elegant shoes", description: "Versatile", checked: true },
      { name: "Makeup bag", description: "Beauty essentials", checked: false },
    ],
  },
  aventure: {
    "Adventure gear": [
      { name: "Swiss army knife", description: "Multi-purpose (checked baggage)", checked: true },
      { name: "Headlamp", description: "USB rechargeable", checked: true },
      { name: "Portable water filter", description: "Essential for trekking", checked: false },
    ],
  },
  business: {
    "Business": [
      { name: "Suit", description: "In garment bag", checked: true },
      { name: "Formal shoes", description: "Polished", checked: true },
      { name: "Laptop", description: "+ charger + mouse", checked: true },
      { name: "Business cards", description: "Plenty of them", checked: true },
    ],
  },
  photo: {
    "Photo / video gear": [
      { name: "Camera", description: "Body + lenses", checked: true },
      { name: "Carbon tripod", description: "Light and stable", checked: true },
      { name: "Batteries (×4)", description: "Charged", checked: true },
      { name: "SD cards (256GB)", description: "×2 minimum", checked: true },
    ],
  },
  randonnée: {
    "Hiking gear": [
      { name: "Trekking shoes", description: "Broken in", checked: true },
      { name: "30-50L backpack", description: "With hip belt", checked: true },
      { name: "Water bottle / Camelbak", description: "2L minimum", checked: true },
      { name: "Rain poncho", description: "Also covers the backpack", checked: true },
    ],
  },
  plage: {
    "Beach essentials": [
      { name: "Swimsuits (×2)", description: "For rotating", checked: true },
      { name: "Sarong / XL towel", description: "Multi-purpose", checked: true },
      { name: "Flip-flops / sandals", description: "Water resistant", checked: true },
      { name: "SPF 50 sunscreen", description: "Waterproof", checked: true },
      { name: "Waterproof bag", description: "For phone + keys", checked: true },
    ],
  },
  roadtrip: {
    "Road trip essentials": [
      { name: "Foldable cooler", description: "For snacks and drinks", checked: true },
      { name: "Phone mount", description: "For navigation", checked: true },
      { name: "Car charger cable", description: "USB-C + Lightning", checked: true },
      { name: "Car first-aid kit", description: "Mandatory in some countries", checked: true },
    ],
  },
  urbain: {
    "City break essentials 🏙️": [
      { name: "Comfortable sneakers", description: "Stylish and good for long walks", checked: true },
      { name: "Anti-theft shoulder bag", description: "Keeps your belongings safe in the city", checked: true },
      { name: "Versatile jacket", description: "Day & night", checked: true },
      { name: "Transit card / app", description: "Metro, bus, bikes", checked: false },
    ],
  },
  luxe: {
    "Luxury essentials 💎": [
      { name: "Premium hard-shell suitcase", description: "Cabin + hold", checked: true },
      { name: "Evening outfit", description: "Tuxedo / cocktail dress", checked: true },
      { name: "Leather toiletry bag", description: "High-end care products", checked: true },
      { name: "Discreet jewellery", description: "Hotel safe recommended", checked: false },
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
};

export const transportExtras = new Proxy({} as Record<TransportMode, Record<string, ChecklistItem[]>>, {
  get: (_t, prop) => (isEn() ? transportExtrasEn : transportExtrasFr)[prop as TransportMode],
});

export function buildCategories(mode: LuggageMode, transport: TransportMode): Record<string, ChecklistItem[]> {
  const base = isEn() ? baseCategoriesEn : baseCategoriesFr;
  const modeSet = (isEn() ? modeExtrasEn : modeExtrasFr)[mode] || {};
  const transportSet = (isEn() ? transportExtrasEn : transportExtrasFr)[transport] || {};
  return { ...base, ...modeSet, ...transportSet };
}

export function detectSuggestedMode(tripTypes?: string[], objectives?: string[]): LuggageMode | null {
  const all = [...(tripTypes || []), ...(objectives || [])].join(" ").toLowerCase();
  if (all.includes("plage") || all.includes("balnéaire") || all.includes("mer") || all.includes("beach")) return "plage";
  if (all.includes("rando") || all.includes("trek") || all.includes("nature") || all.includes("hik")) return "randonnée";
  if (all.includes("business") || all.includes("professionnel")) return "business";
  if (all.includes("road") || all.includes("voiture") || all.includes("car")) return "roadtrip";
  if (all.includes("photo") || all.includes("créat") || all.includes("creativ")) return "photo";
  if (all.includes("aventure") || all.includes("adventure") || all.includes("sport")) return "aventure";
  if (all.includes("luxe") || all.includes("luxury") || all.includes("premium")) return "luxe";
  if (all.includes("city") || all.includes("urbain") || all.includes("ville")) return "urbain";
  if (all.includes("confort") || all.includes("comfort")) return "confort";
  return null;
}
