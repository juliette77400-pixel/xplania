// Locale-aware formatting helpers
// Use throughout the app for currencies, numbers, dates, distance, temperature.
// Reads the active i18n language so output adapts to FR/EN automatically.

import i18n from "@/i18n";

const localeMap: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
};

function getLocale(): string {
  const lang = (i18n.language || "fr").slice(0, 2);
  return localeMap[lang] ?? "en-US";
}

/** Imperial units (mi, °F) for en-US; metric otherwise. */
export function useImperialUnits(): boolean {
  return getLocale() === "en-US";
}

export function formatCurrency(
  amount: number,
  currency = "EUR",
  options: Intl.NumberFormatOptions = {}
): string {
  try {
    return new Intl.NumberFormat(getLocale(), {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  try {
    return new Intl.NumberFormat(getLocale(), options).format(value);
  } catch {
    return String(value);
  }
}

export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
): string {
  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    return new Intl.DateTimeFormat(getLocale(), options).format(d);
  } catch {
    return String(date);
  }
}

export function formatRelativeDays(days: number): string {
  try {
    const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: "auto" });
    return rtf.format(days, "day");
  } catch {
    return `${days}d`;
  }
}

/** Distance in km input → mi for imperial, km otherwise. */
export function formatDistance(km: number, fractionDigits = 1): string {
  if (useImperialUnits()) {
    const mi = km * 0.621371;
    return `${formatNumber(mi, { maximumFractionDigits: fractionDigits })} mi`;
  }
  return `${formatNumber(km, { maximumFractionDigits: fractionDigits })} km`;
}

/** Temperature in °C input → °F for imperial, °C otherwise. */
export function formatTemperature(celsius: number, fractionDigits = 0): string {
  if (useImperialUnits()) {
    const f = (celsius * 9) / 5 + 32;
    return `${formatNumber(f, { maximumFractionDigits: fractionDigits })}°F`;
  }
  return `${formatNumber(celsius, { maximumFractionDigits: fractionDigits })}°C`;
}
