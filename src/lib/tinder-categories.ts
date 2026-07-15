// Category grouping for the onboarding Tinder deck.
// Derived at runtime from each card's `score_tags` (dominant dimension →
// category) so we don't have to migrate the `tinder_cards` table.
import type { LucideIcon } from "lucide-react";
import { Sparkles, Wallet, Bed, Plane, Compass, Zap, Leaf } from "lucide-react";
import type { TravelerDimension } from "./traveler-badge";

export type CategoryKey =
  | "immersion"
  | "activites"
  | "type_voyage"
  | "but_voyage"
  | "transport"
  | "budget"
  | "ecologie";

export interface CategoryDef {
  key: CategoryKey;
  labelKey: string;
  fallback: string;
  Icon: LucideIcon;
  /** Accent color class used on chips/badges/cards. */
  accent: string;
  ring: string;
  chipBg: string;
  border: string;
}

/** Order used when rendering the category tabs / progress bars. */
export const CATEGORY_ORDER: CategoryKey[] = [
  "immersion",
  "activites",
  "type_voyage",
  "but_voyage",
  "transport",
  "budget",
  "ecologie",
];

export const CATEGORIES: Record<CategoryKey, CategoryDef> = {
  immersion:   { key: "immersion",   labelKey: "tinder.cat.immersion",   fallback: "Immersion",      Icon: Sparkles, accent: "text-amber-300",   ring: "ring-amber-400/50",   chipBg: "bg-amber-400/10",   border: "border-amber-400/40" },
  activites:   { key: "activites",   labelKey: "tinder.cat.activites",   fallback: "Activités",      Icon: Zap,      accent: "text-orange-300",  ring: "ring-orange-400/50",  chipBg: "bg-orange-400/10",  border: "border-orange-400/40" },
  type_voyage: { key: "type_voyage", labelKey: "tinder.cat.type",        fallback: "Type de voyage", Icon: Bed,      accent: "text-pink-300",    ring: "ring-pink-400/50",    chipBg: "bg-pink-400/10",    border: "border-pink-400/40" },
  but_voyage:  { key: "but_voyage",  labelKey: "tinder.cat.but",         fallback: "But du voyage",  Icon: Compass,  accent: "text-cyan-300",    ring: "ring-cyan-400/50",    chipBg: "bg-cyan-400/10",    border: "border-cyan-400/40" },
  transport:   { key: "transport",   labelKey: "tinder.cat.transport",   fallback: "Transport",      Icon: Plane,    accent: "text-sky-300",     ring: "ring-sky-400/50",     chipBg: "bg-sky-400/10",     border: "border-sky-400/40" },
  budget:      { key: "budget",      labelKey: "tinder.cat.budget",      fallback: "Budget",         Icon: Wallet,   accent: "text-emerald-300", ring: "ring-emerald-400/50", chipBg: "bg-emerald-400/10", border: "border-emerald-400/40" },
  ecologie:    { key: "ecologie",    labelKey: "tinder.cat.ecologie",    fallback: "Écologie",       Icon: Leaf,     accent: "text-green-300",   ring: "ring-green-400/50",   chipBg: "bg-green-400/10",   border: "border-green-400/40" },
};

const DIMENSION_TO_CATEGORY: Record<TravelerDimension, CategoryKey> = {
  culture: "immersion",
  authenticity: "immersion",
  adventure: "activites",
  food: "activites",
  social: "activites",
  comfort: "type_voyage",
  luxury: "type_voyage",
  wellbeing: "but_voyage",
  nomad: "transport",
  organization: "transport",
  budget: "budget",
  nature: "ecologie",
};

/** Pick the category from the card's strongest score_tag dimension. */
export function categoryForCard(scoreTags: Record<string, number> | null | undefined): CategoryKey {
  if (!scoreTags) return "immersion";
  let bestKey: string | null = null;
  let bestVal = -Infinity;
  for (const [k, v] of Object.entries(scoreTags)) {
    if (!(k in DIMENSION_TO_CATEGORY)) continue;
    const abs = Math.abs(Number(v) || 0);
    if (abs > bestVal) {
      bestVal = abs;
      bestKey = k;
    }
  }
  return bestKey ? DIMENSION_TO_CATEGORY[bestKey as TravelerDimension] : "immersion";
}
