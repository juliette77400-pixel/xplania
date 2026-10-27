// Visa fees and processing times are shown only when they come from an
// official text. The AI often guesses them ("environ 25 €"), so any sentence
// with a fee amount or a processing delay whose numbers are not found in the
// official extract is removed. No imports: also tested from src/.
// deno-lint-ignore-file no-explicit-any

const CURRENCY = "(?:€|\\$|£|¥|₩|₹|euros?|eur|usd|cad|aud|nzd|gbp|jpy|krw|chf|inr|thb|aed|mxn|brl|sgd|cny|rmb|try|yens?|wons?|dollars?|livres?|francs?|dirhams?|dhs?|pesos?|reais|roupies?|rupees?|bahts?|yuans?|lires?)";
const MONEY = new RegExp(`\\d[\\d\\s.,]*\\s*${CURRENCY}(?![a-z])|${CURRENCY}\\s*\\d`, "i");
const DELAY_WORD = /(délai|traitement|instruction|obten|délivr|processing|turnaround|issued|issuance|to get|to obtain)/i;
const DURATION = /\d+\s*(?:(?:à|-|–|to|ou|or)\s*\d+\s*)?(?:jours?|semaines?|mois|heures?|days?|weeks?|months?|hours?)\b/i;

const normalize = (s: string) => s.replace(/(\d)[\s\u00a0\u202f.](?=\d{3}\b)/g, "$1").replace(/(\d),(\d)/g, "$1.$2");
const numbersOf = (s: string) => normalize(s).match(/\d+(?:\.\d+)?/g) ?? [];

/** True when the text states a fee amount or a processing time. */
export function hasVisaFigure(s: string): boolean {
  return MONEY.test(s) || (DELAY_WORD.test(s) && DURATION.test(s));
}

const grounded = (s: string, official: Set<string>) => {
  const n = numbersOf(s);
  return n.length > 0 && n.every((x) => official.has(x));
};

/** Removes the sentences that give an unofficial fee or delay. */
export function cleanVisaText(s: string, official: Set<string>): string {
  if (typeof s !== "string" || !hasVisaFigure(s)) return s;
  return s.split(/(?<=[.!?;])\s+/)
    .filter((part) => !hasVisaFigure(part) || grounded(part, official))
    .join(" ")
    .trim();
}

export function officialNumbers(officialText: string): Set<string> {
  return new Set(numbersOf(officialText || ""));
}

/** Keeps cost / processing time only when every number is in the official text. */
export function officialFigure(value: string, official: Set<string>): string {
  return typeof value === "string" && grounded(value, official) ? value.trim() : "";
}

/** Applies the rule to a visa-info answer, in place. Returns the answer. */
export function stripUnofficialFigures(result: any, officialText: string): any {
  const set = officialNumbers(officialText);
  const list = (a: unknown) => Array.isArray(a) ? a.map((x) => cleanVisaText(String(x ?? ""), set)).filter(Boolean) : [];
  if (result?.visa) {
    result.visa.cost = officialFigure(result.visa.cost, set);
    result.visa.processing_time = officialFigure(result.visa.processing_time, set);
    result.visa.summary = cleanVisaText(result.visa.summary, set);
    result.visa.steps = list(result.visa.steps);
  }
  if (result?.passport) {
    result.passport.summary = cleanVisaText(result.passport.summary, set);
    result.passport.rules = list(result.passport.rules);
  }
  if (result?.transit) result.transit.summary = cleanVisaText(result.transit.summary, set);
  if (Array.isArray(result?.checklist)) {
    result.checklist = result.checklist
      .map((c: any) => ({ ...c, item: cleanVisaText(c?.item ?? "", set), detail: cleanVisaText(c?.detail ?? "", set) }))
      .filter((c: any) => c.item);
  }
  return result;
}
