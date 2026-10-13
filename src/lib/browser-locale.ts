// Langue de l'ordinateur (navigateur), alignée sur la détection i18n : fr par défaut, sinon en.
export type UiLang = "fr" | "en";

export function browserLang(): UiLang {
  if (typeof navigator === "undefined") return "fr";
  const list: readonly string[] =
    navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  for (const l of list) {
    const code = (l || "").toLowerCase();
    if (code.startsWith("fr")) return "fr";
    if (code.startsWith("en")) return "en";
  }
  return "fr";
}
