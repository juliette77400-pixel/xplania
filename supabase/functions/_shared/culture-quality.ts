// Deterministic quality check of an AI cultural theme before it is cached and
// shared with every student (no second AI call). A theme that fails is still
// shown to the student who asked, but it is not saved, so a weak text never
// becomes the shared version.
// deno-lint-ignore-file no-explicit-any

export interface CultureTip { text?: string; why?: string; example?: string; nuance?: string; severity?: string }
export interface CulturePillar { ping?: string; dos?: CultureTip[]; donts?: CultureTip[]; homeVsHere?: unknown[] }

const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
const filled = (s: unknown, min: number) => norm(s).length >= min;
const INCLUSIVE = /\p{L}·\p{L}/u;

/** Problems found in a generated theme; an empty list means it can be cached. */
export function cultureQualityIssues(content: CulturePillar | null | undefined, country: string): string[] {
  const issues: string[] = [];
  if (!content || typeof content !== "object") return ["empty"];
  const dos = Array.isArray(content.dos) ? content.dos : [];
  const donts = Array.isArray(content.donts) ? content.donts : [];
  if (dos.length < 3) issues.push("too_few_dos");
  if (donts.length < 3) issues.push("too_few_donts");
  const tips = [...dos, ...donts];
  if (tips.some((t) => !filled(t?.text, 8) || !filled(t?.why, 15) || !filled(t?.example, 20) || !filled(t?.nuance, 15))) issues.push("incomplete_tip");
  const texts = tips.map((t) => norm(t?.text));
  if (new Set(texts).size !== texts.length) issues.push("duplicate_tip");
  if (!Array.isArray(content.homeVsHere) || content.homeVsHere.length < 2) issues.push("missing_comparison");
  // Local anchoring: examples set in the country (a named place or the country),
  // and at least one local word or concept written as such.
  const countryKey = norm(country);
  const placeLike = /(^|[\s(«"'’])\p{Lu}\p{Ll}{2,}/u;
  const anchored = tips.filter((t) => {
    const ex = String(t?.example ?? "");
    return (countryKey && norm(ex).includes(countryKey)) || placeLike.test(ex.replace(/^\s*\p{Lu}/u, ""));
  }).length;
  if (tips.length && anchored < Math.ceil(tips.length / 2)) issues.push("not_local_enough");
  const all = tips.map((t) => `${t?.text} ${t?.why} ${t?.example} ${t?.nuance}`).join(" ");
  if (!/[«»"*“”]/.test(all)) issues.push("no_local_term");
  if (INCLUSIVE.test(`${content.ping ?? ""} ${all}`)) issues.push("inclusive_writing");
  return issues;
}
