// Local date at the destination, so "today" content changes at the destination's midnight.
// One main time zone per country (the capital's, or the most populated area's); the device
// time zone is used for countries not listed.
const COUNTRY_TZ: Record<string, string> = {
  FR: "Europe/Paris", ES: "Europe/Madrid", PT: "Europe/Lisbon", IT: "Europe/Rome", DE: "Europe/Berlin",
  GB: "Europe/London", IE: "Europe/Dublin", NL: "Europe/Amsterdam", BE: "Europe/Brussels", LU: "Europe/Luxembourg",
  CH: "Europe/Zurich", AT: "Europe/Vienna", PL: "Europe/Warsaw", CZ: "Europe/Prague", HU: "Europe/Budapest",
  SE: "Europe/Stockholm", NO: "Europe/Oslo", DK: "Europe/Copenhagen", FI: "Europe/Helsinki", GR: "Europe/Athens",
  RO: "Europe/Bucharest", BG: "Europe/Sofia", HR: "Europe/Zagreb", SI: "Europe/Ljubljana", SK: "Europe/Bratislava",
  EE: "Europe/Tallinn", LV: "Europe/Riga", LT: "Europe/Vilnius", MT: "Europe/Malta", CY: "Asia/Nicosia",
  IS: "Atlantic/Reykjavik", TR: "Europe/Istanbul", MA: "Africa/Casablanca", TN: "Africa/Tunis", DZ: "Africa/Algiers",
  SN: "Africa/Dakar", CI: "Africa/Abidjan", CM: "Africa/Douala", ZA: "Africa/Johannesburg", KE: "Africa/Nairobi",
  EG: "Africa/Cairo", AE: "Asia/Dubai", QA: "Asia/Qatar", IL: "Asia/Jerusalem", LB: "Asia/Beirut", IN: "Asia/Kolkata",
  CN: "Asia/Shanghai", HK: "Asia/Hong_Kong", TW: "Asia/Taipei", JP: "Asia/Tokyo", KR: "Asia/Seoul", SG: "Asia/Singapore",
  TH: "Asia/Bangkok", VN: "Asia/Ho_Chi_Minh", MY: "Asia/Kuala_Lumpur", ID: "Asia/Jakarta", PH: "Asia/Manila",
  AU: "Australia/Sydney", NZ: "Pacific/Auckland", US: "America/New_York", CA: "America/Toronto", MX: "America/Mexico_City",
  BR: "America/Sao_Paulo", AR: "America/Argentina/Buenos_Aires", CL: "America/Santiago", CO: "America/Bogota",
  PE: "America/Lima", UY: "America/Montevideo", CR: "America/Costa_Rica",
};

/** IANA time zone used for a country (device time zone when unknown). */
export function countryTimeZone(code: string | null | undefined): string | undefined {
  return (code && COUNTRY_TZ[code.toUpperCase()]) || undefined;
}

/** YYYY-MM-DD at the destination right now. */
export function localDateFor(code: string | null | undefined, now: Date = new Date()): string {
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", { timeZone: countryTimeZone(code), year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}
