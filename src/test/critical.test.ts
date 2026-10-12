import { describe, it, expect, beforeEach } from "vitest";
import fr from "@/i18n/locales/fr.json";
import en from "@/i18n/locales/en.json";
import { getConsent, setConsent } from "@/lib/consent";

const keys = (o: unknown, p = ""): string[] =>
  o && typeof o === "object" && !Array.isArray(o)
    ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => keys(v, p ? `${p}.${k}` : k))
    : [p];

describe("traductions", () => {
  it("les nouvelles clés existent en FR et en EN", () => {
    const enKeys = new Set(keys(en));
    for (const k of ["reportAi.button", "settings.revokeShares.button"]) {
      expect(keys(fr)).toContain(k);
      expect(enKeys.has(k)).toBe(true);
    }
  });
});

describe("consentement cookies", () => {
  beforeEach(() => localStorage.clear());
  it("aucun consentement par défaut", () => expect(getConsent()).toBeNull());
  it("mémorise le refus des statistiques", () => {
    setConsent(false);
    expect(getConsent()?.analytics).toBe(false);
  });
});
