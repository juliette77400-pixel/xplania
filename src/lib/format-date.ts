// Short localized dates for "updated on" / "checked at" labels.
export function formatDay(iso: string | null | undefined, lang: string): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(lang.startsWith("fr") ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDayTime(iso: string | null | undefined, lang: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(lang.startsWith("fr") ? "fr-FR" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
