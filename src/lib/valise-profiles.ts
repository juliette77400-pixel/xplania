// Practical luggage profiles for students (replace the former aesthetic styles)
// and the clothing hints derived from the usual weather of the stay months.

export const VALISE_PROFILES = ["erasmus", "stage", "cabine", "soute", "sport"] as const;
export type ValiseProfile = (typeof VALISE_PROFILES)[number];

export const isValiseProfile = (v: unknown): v is ValiseProfile =>
  typeof v === "string" && (VALISE_PROFILES as readonly string[]).includes(v);

/** Profile suggested from the questionnaire's stay type. */
export function suggestProfile(stayType: string | null | undefined, days: number): ValiseProfile {
  if (stayType === "internship") return "stage";
  if (stayType === "erasmus" || days >= 60) return "erasmus";
  return "soute";
}

export interface ClimateMonth {
  month: number;
  tmax: number | null;
  tmin: number | null;
  rainyDays: number;
  days?: number;
}

export type ClimateHint = "cold" | "cool" | "hot" | "rain" | "twoSeasons";

/** What the usual weather of the stay implies for the suitcase. */
export function climateHints(months: ClimateMonth[]): ClimateHint[] {
  const mins = months.map((m) => m.tmin).filter((v): v is number => typeof v === "number");
  const maxs = months.map((m) => m.tmax).filter((v): v is number => typeof v === "number");
  if (!mins.length || !maxs.length) return [];
  const coldest = Math.min(...mins);
  const hottest = Math.max(...maxs);
  const out: ClimateHint[] = [];
  if (coldest <= 3) out.push("cold");
  else if (coldest <= 10) out.push("cool");
  if (hottest >= 27) out.push("hot");
  if (months.some((m) => m.rainyDays >= 10)) out.push("rain");
  if (hottest - coldest >= 18) out.push("twoSeasons");
  return out;
}
