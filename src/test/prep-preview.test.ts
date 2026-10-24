import { describe, expect, it } from "vitest";
import { daysUntil, previewSteps } from "@/lib/prep-preview";
import { emptyPrepAnswers } from "@/lib/prep-quiz";

const base = { ...emptyPrepAnswers(), destinationCode: "ES", nationality: "FR", residence: "FR", stayType: "erasmus" as const, housingStatus: "starting" as const };
const today = new Date("2026-10-24T10:00:00");

describe("aperçu avant inscription : 3 priorités", () => {
  it("donne toujours 3 démarches : visa, logement, budget", () => {
    const s = previewSteps(base, today);
    expect(s).toHaveLength(3);
    expect(s.map((x) => x.module).sort()).toEqual(["budget", "housing", "visa"]);
  });
  it("Européen dans l'UE : pas de visa, la priorité n'est pas le visa", () => {
    const s = previewSteps(base, today);
    expect(s.find((x) => x.module === "visa")?.key).toBe("visaFree");
    expect(s[0].module).not.toBe("visa");
  });
  it("hors UE : vérifier le visa passe en premier", () => {
    const s = previewSteps({ ...base, destinationCode: "JP" }, today);
    expect(s[0]).toMatchObject({ module: "visa", key: "visaCheck" });
  });
  it("départ dans moins de 2 mois : message visa urgent", () => {
    const s = previewSteps({ ...base, destinationCode: "JP", departureDate: "2026-12-01" }, today);
    expect(s[0].key).toBe("visaCheckSoon");
  });
  it("logement perdu : priorité au logement ; logement confirmé : installation", () => {
    expect(previewSteps({ ...base, housingStatus: "lost" }, today)[0].key).toBe("housingLost");
    expect(previewSteps({ ...base, housingStatus: "confirmed" }, today).find((x) => x.module === "housing")?.key).toBe("housingSettle");
  });
  it("budget donné : on vérifie le premier mois avec ce montant", () => {
    const s = previewSteps({ ...base, budget: "3000" }, today);
    expect(s.find((x) => x.module === "budget")).toMatchObject({ key: "budgetFirstMonth", vars: { amount: 3000 } });
  });
  it("compte les jours avant le départ", () => {
    expect(daysUntil("2026-12-23", today)).toBe(60);
    expect(daysUntil("", today)).toBeNull();
  });
});
