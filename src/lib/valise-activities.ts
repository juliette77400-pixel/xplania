// Activities a student plans during the stay. They add packing items, shape outfits and tips,
// and are saved per trip (trips.form_data.valiseActivities). Pure data + helpers, tested.
import type { ChecklistItem } from "@/components/valise/ChecklistSection";

export const VALISE_ACTIVITIES = ["study", "internship", "hiking", "beach", "sport", "nightlife", "culture", "excursions"] as const;
export type ValiseActivity = (typeof VALISE_ACTIVITIES)[number];

export const isValiseActivity = (v: unknown): v is ValiseActivity =>
  typeof v === "string" && (VALISE_ACTIVITIES as readonly string[]).includes(v);

/** Keeps only known activity ids, without duplicates. */
export function cleanActivities(list: unknown): ValiseActivity[] {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter(isValiseActivity))];
}

type Item = { fr: [string, string]; en: [string, string] };
const it = (frName: string, frDesc: string, enName: string, enDesc: string): Item => ({ fr: [frName, frDesc], en: [enName, enDesc] });

const ITEMS: Record<ValiseActivity, Item[]> = {
  study: [
    it("Ordinateur portable + chargeur", "Pour les cours et les dossiers", "Laptop + charger", "For classes and assignments"),
    it("Sac à dos pour les cours", "Assez grand pour un ordinateur", "Backpack for classes", "Big enough for a laptop"),
    it("Copies de tes documents d'inscription", "Contrat d'études, lettre d'acceptation", "Copies of your enrolment papers", "Learning agreement, acceptance letter"),
    it("Clé USB ou disque externe", "Sauvegarde de tes cours", "USB stick or external drive", "Back up your course work"),
  ],
  internship: [
    it("2 à 3 tenues professionnelles", "Selon le code vestimentaire de l'entreprise", "2–3 work outfits", "Depending on the company dress code"),
    it("Chaussures de ville confortables", "Tu marcheras beaucoup", "Comfortable smart shoes", "You'll walk a lot"),
    it("Convention de stage imprimée", "Souvent demandée le premier jour", "Printed internship agreement", "Often asked for on day one"),
    it("Petit sac pour l'ordinateur", "Pour aller au bureau", "Small laptop bag", "To go to the office"),
  ],
  hiking: [
    it("Chaussures de randonnée", "Déjà portées avant le départ", "Hiking boots", "Worn in before you leave"),
    it("Veste coupe-vent imperméable", "Le temps change vite en altitude", "Waterproof windbreaker", "Weather changes fast at altitude"),
    it("Gourde réutilisable", "1 L minimum", "Reusable water bottle", "At least 1 L"),
    it("Petit sac de jour 20–30 L", "Pour la journée", "20–30 L day pack", "For day hikes"),
  ],
  beach: [
    it("Maillot de bain", "Deux, pour alterner", "Swimsuit", "Two, to switch"),
    it("Serviette microfibre", "Sèche vite, prend peu de place", "Microfibre towel", "Dries fast, packs small"),
    it("Crème solaire SPF 50", "À remettre après la baignade", "SPF 50 sunscreen", "Reapply after swimming"),
    it("Sandales ou tongs", "Pour la plage et la douche", "Sandals or flip-flops", "For the beach and showers"),
  ],
  sport: [
    it("Tenue de sport respirante", "Deux tenues pour alterner", "Breathable sportswear", "Two sets to switch"),
    it("Baskets de sport", "Adaptées à ton sport", "Sports shoes", "Suited to your sport"),
    it("Gourde de sport", "Pour les entraînements", "Sports bottle", "For training"),
    it("Certificat médical si club", "Souvent demandé pour s'inscrire", "Medical certificate for a club", "Often required to join"),
  ],
  nightlife: [
    it("Une tenue pour sortir", "Une pièce habillée qui se mélange au reste", "A going-out outfit", "One dressy piece that mixes with the rest"),
    it("Chaussures fermées confortables", "Certains lieux refusent les tongs", "Comfortable closed shoes", "Some venues refuse flip-flops"),
    it("Petite pochette ou banane", "Garde téléphone et papiers près de toi", "Small pouch or belt bag", "Keep phone and ID close"),
  ],
  culture: [
    it("Chaussures de marche confortables", "Musées et vieilles villes se font à pied", "Comfortable walking shoes", "Museums and old towns are done on foot"),
    it("Tenue couvrant épaules et genoux", "Exigée dans certains lieux religieux", "Outfit covering shoulders and knees", "Required in some religious sites"),
    it("Carte étudiante (et internationale si tu l'as)", "Réductions fréquentes dans les musées", "Student card (international if you have one)", "Frequent museum discounts"),
  ],
  excursions: [
    it("Sac de week-end léger", "Pour partir 2–3 jours sans ta valise", "Light weekend bag", "For 2–3 days without your suitcase"),
    it("Batterie externe", "Billets et cartes sur ton téléphone", "Power bank", "Tickets and maps on your phone"),
    it("Trousse de toilette format voyage", "Toujours prête à partir", "Travel-size toiletry bag", "Always ready to go"),
  ],
};

/** Checklist category built from the chosen activities (nothing ticked). */
export function activityChecklist(activities: ValiseActivity[], other: string, en: boolean): Record<string, ChecklistItem[]> {
  const lang = en ? "en" : "fr";
  const seen = new Set<string>();
  const items: ChecklistItem[] = [];
  for (const a of activities) {
    for (const x of ITEMS[a]) {
      const [name, description] = x[lang];
      if (seen.has(name)) continue;
      seen.add(name);
      items.push({ name, description, checked: false });
    }
  }
  const custom = other.trim();
  if (custom) items.push({ name: en ? `Gear for: ${custom}` : `Équipement pour : ${custom}`, description: en ? "Check what this activity needs" : "Vérifie ce dont cette activité a besoin", checked: false });
  if (!items.length) return {};
  return { [en ? "For your activities 🎯" : "Pour tes activités 🎯"]: items };
}
