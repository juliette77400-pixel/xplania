import { describe, expect, it } from "vitest";
import { stripUnofficialFigures } from "../../supabase/functions/_shared/visa-figures";

const answer = () => ({
  visa: {
    cost: "environ 25 €",
    processing_time: "5 jours ouvrés",
    summary: "Un visa stage est nécessaire. Les frais sont d'environ 25 €.",
    steps: ["Prends rendez-vous à l'ambassade.", "Compte un délai de 5 jours ouvrés."],
  },
  passport: { summary: "Passeport valide pendant tout le séjour.", rules: [] },
  transit: { summary: "" },
  checklist: [
    { item: "Payer les frais de visa", detail: "Environ 3 000 yens. Garde le reçu." },
    { item: "Assurance santé", detail: "Recommandée pour 6 mois." },
  ],
});

describe("visa fees and delays", () => {
  it("removes an AI-estimated fee when there is no official text", () => {
    const r = stripUnofficialFigures(answer(), "");
    expect(r.visa.cost).toBe("");
    expect(r.visa.summary).toBe("Un visa stage est nécessaire.");
    expect(r.checklist[0].detail).toBe("Garde le reçu.");
  });

  it("removes an AI-estimated processing time when there is no official text", () => {
    const r = stripUnofficialFigures(answer(), "");
    expect(r.visa.processing_time).toBe("");
    expect(r.visa.steps).toEqual(["Prends rendez-vous à l'ambassade."]);
  });

  it("keeps a fee whose amount is written in the official text", () => {
    const r = stripUnofficialFigures(answer(), "Les frais de visa s'élèvent à 25 € (France Diplomatie).");
    expect(r.visa.cost).toBe("environ 25 €");
  });

  it("keeps sentences without fees or delays", () => {
    const r = stripUnofficialFigures(answer(), "");
    expect(r.checklist[1].detail).toBe("Recommandée pour 6 mois.");
    expect(r.passport.summary).toBe("Passeport valide pendant tout le séjour.");
  });
});
