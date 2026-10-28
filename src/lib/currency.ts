import { findCountry } from "@/lib/country-match";

// ✨ NEW — Frankfurter API (gratuit, BCE) pour conversion de devises
const BASE = "https://api.frankfurter.app";

export const SUPPORTED_CURRENCIES = [
  "EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "HKD", "SGD",
  "THB", "MXN", "BRL", "INR", "ZAR", "TRY", "PLN", "SEK", "NOK", "DKK",
  "CZK", "HUF", "RON", "BGN", "HRK", "ILS", "KRW", "MYR", "NZD", "PHP", "IDR",
  // Shown by the converter (open.er-api rates); not available on Frankfurter.
  "CLP", "ARS", "PEN", "XPF",
] as const;

// Heuristique pays → devise (couvre les principales destinations)
const COUNTRY_TO_CCY: Record<string, string> = {
  france: "EUR", espagne: "EUR", spain: "EUR", italie: "EUR", italy: "EUR",
  portugal: "EUR", grece: "EUR", greece: "EUR", allemagne: "EUR", germany: "EUR",
  pays: "EUR", belgique: "EUR", belgium: "EUR", "royaume-uni": "GBP", uk: "GBP",
  angleterre: "GBP", england: "GBP", "etats-unis": "USD", "états-unis": "USD",
  usa: "USD", "united states": "USD", canada: "CAD", japon: "JPY", japan: "JPY",
  suisse: "CHF", switzerland: "CHF", chine: "CNY", china: "CNY", thailande: "THB",
  thaïlande: "THB", thailand: "THB", mexique: "MXN", mexico: "MXN", bresil: "BRL",
  brésil: "BRL", brazil: "BRL", inde: "INR", india: "INR", australie: "AUD",
  australia: "AUD", "afrique du sud": "ZAR", "south africa": "ZAR", turquie: "TRY",
  turkey: "TRY", pologne: "PLN", poland: "PLN", suede: "SEK", suède: "SEK",
  sweden: "SEK", norvege: "NOK", norvège: "NOK", norway: "NOK", danemark: "DKK",
  denmark: "DKK", coree: "KRW", corée: "KRW", korea: "KRW", malaisie: "MYR",
  malaysia: "MYR", singapour: "SGD", singapore: "SGD", indonesie: "IDR",
  indonésie: "IDR", indonesia: "IDR", philippines: "PHP", maroc: "EUR",
  morocco: "EUR", "hong kong": "HKD",
};

// Currency of a country recognised by findCountry (Bulgaria uses the euro since 1 January 2026).
const CODE_TO_CCY: Record<string, string> = {
  FR: "EUR", ES: "EUR", IT: "EUR", PT: "EUR", GR: "EUR", DE: "EUR", BE: "EUR", NL: "EUR", AT: "EUR", IE: "EUR",
  BG: "EUR", FI: "EUR", LU: "EUR", MT: "EUR", CY: "EUR", SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", HR: "EUR",
  GB: "GBP", US: "USD", CA: "CAD", JP: "JPY", CH: "CHF", CN: "CNY", TH: "THB", MX: "MXN", BR: "BRL", IN: "INR",
  AU: "AUD", ZA: "ZAR", TR: "TRY", PL: "PLN", SE: "SEK", NO: "NOK", DK: "DKK", KR: "KRW", MY: "MYR", SG: "SGD",
  ID: "IDR", PH: "PHP", HK: "HKD", NZ: "NZD", HU: "HUF", CZ: "CZK", RO: "RON", CL: "CLP", AR: "ARS", PE: "PEN",
  RE: "EUR", GP: "EUR", MQ: "EUR", YT: "EUR", GF: "EUR", NC: "XPF", PF: "XPF", WF: "XPF", FO: "DKK", GL: "DKK", SJ: "NOK",
};

export function guessCurrency(destination?: string | null): string {
  if (!destination) return "EUR";
  const parts = destination.split(",").map((x) => x.trim()).reverse();
  for (const part of parts) {
    const code = findCountry(part);
    if (code && CODE_TO_CCY[code]) return CODE_TO_CCY[code];
  }
  const lower = destination.toLowerCase();
  for (const key of Object.keys(COUNTRY_TO_CCY)) {
    if (lower.includes(key)) return COUNTRY_TO_CCY[key];
  }
  return "USD";
}

export interface ConversionResult {
  rate: number;
  result: number;
  date: string;
}

export async function convert(amount: number, from: string, to: string): Promise<ConversionResult> {
  if (from === to) return { rate: 1, result: amount, date: new Date().toISOString().slice(0, 10) };
  const res = await fetch(`${BASE}/latest?amount=${amount}&from=${from}&to=${to}`);
  if (!res.ok) throw new Error("currency_fetch_failed");
  const data = await res.json();
  const rate = data?.rates?.[to];
  if (typeof rate !== "number") throw new Error("currency_invalid");
  return { rate: rate / amount, result: rate, date: data.date };
}
