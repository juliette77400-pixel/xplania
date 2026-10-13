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
    for (const k of ["reportAi.button", "settings.revokeShares.button", "ui2.TripActionsMenu.edit", "travelForm.saveError", "travelForm.retrySave", "travelForm.validation.destination", "ui2.trip-export-all.photoUnavailable"]) {
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

describe("cohérence des textes légaux", () => {
  it("précise les essais IA de la bêta en FR et EN", () => {
    expect(fr.legal.cgu.sections[2].body).toContain("10 essais IA par outil et par mois");
    expect(en.legal.cgu.sections[2].body).toContain("10 AI tries per tool per month");
  });

  it("harmonise la mesure d'audience avec le consentement et les 13 mois", () => {
    const frAnalytics = fr.legal.confidentialite.sections[1].body.split("• Mesure d'audience")[1];
    const enAnalytics = en.legal.confidentialite.sections[1].body.split("• Audience measurement")[1];
    expect(frAnalytics).toContain("Base légale : consentement");
    expect(frAnalytics).toContain("13 mois maximum");
    expect(frAnalytics).not.toContain("intérêt légitime");
    expect(enAnalytics).toContain("Legal basis: consent");
    expect(enAnalytics).toContain("up to 13 months");
    expect(enAnalytics).not.toContain("legitimate interest");
  });
});
