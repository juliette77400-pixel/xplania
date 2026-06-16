export type LegalKey = "mentions" | "confidentialite" | "cgu";

const ROUTES: Record<LegalKey, { fr: string; en: string }> = {
  mentions: { fr: "/mentions-legales", en: "/legal-notice" },
  confidentialite: { fr: "/politique-de-confidentialite", en: "/privacy-policy" },
  cgu: { fr: "/conditions-utilisation", en: "/terms-of-use" },
};

export const getLegalPath = (key: LegalKey, lang: string | undefined): string => {
  const l = lang && lang.toLowerCase().startsWith("en") ? "en" : "fr";
  return ROUTES[key][l];
};

export const ALL_LEGAL_KEYS: LegalKey[] = ["mentions", "confidentialite", "cgu"];
