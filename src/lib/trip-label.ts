// Name shown on each trip button of the dashboard. Two trips with the same
// place get their departure month added, so they can be told apart.
import { placeName } from "@/lib/country-match";
export interface TripLabelInput {
  id: string;
  destination?: string | null;
  arrival_city?: string | null;
  title?: string | null;
  departure_date?: string | null;
}

const place = (t: TripLabelInput, lang: string): string => {
  const dest = placeName((t.destination || "").trim(), lang);
  const city = (t.arrival_city || "").trim();
  if (city && dest && city.toLowerCase() !== dest.toLowerCase()) return `${city}, ${dest}`;
  return dest || city || (t.title || "").trim();
};

const month = (iso: string | null | undefined, lang: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(lang.startsWith("en") ? "en-GB" : "fr-FR", { month: "short", year: "numeric" });
};

export function tripLabels(trips: TripLabelInput[], lang: string, fallback: string): Record<string, string> {
  const base = trips.map((t) => place(t, lang) || fallback);
  const out: Record<string, string> = {};
  trips.forEach((t, i) => {
    const same = base.filter((b) => b === base[i]).length > 1;
    const m = same ? month(t.departure_date, lang) : "";
    let label = m ? `${base[i]} · ${m}` : base[i];
    // Still identical (same place and month): number them.
    if (same) {
      const twins = trips.filter((o, j) => base[j] === base[i] && month(o.departure_date, lang) === m);
      if (twins.length > 1) label = `${label} (${twins.findIndex((o) => o.id === t.id) + 1})`;
    }
    out[t.id] = label;
  });
  return out;
}
