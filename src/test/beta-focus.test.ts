import { describe, it, expect, beforeEach } from "vitest";
import { FEATURE_FLAGS, isPathEnabled } from "@/config/featureFlags";
import { buildPrepTripData } from "@/components/dashboard/CreateTripForm";
import { readTripProgress, saveModuleProgress, overallPercent } from "@/lib/prep-progress";
import { validateTravelBasics } from "@/lib/travel-form-validation";

describe("bêta : un seul besoin, préparer son voyage en amont", () => {
  it("les 5 outils de préparation sont actifs", () => {
    expect(FEATURE_FLAGS.ENABLE_BUDGET_GUIDE).toBe(true);
    expect(FEATURE_FLAGS.ENABLE_VISA_GUIDE).toBe(true);
    expect(FEATURE_FLAGS.ENABLE_PACKING_LIST).toBe(true);
    expect(FEATURE_FLAGS.ENABLE_CULTURAL_GUIDE).toBe(true);
    expect(FEATURE_FLAGS.ENABLE_HOUSING_ASSISTANT).toBe(true);
  });

  it("les autres modules sont coupés", () => {
    expect(FEATURE_FLAGS.ENABLE_MOOD_EXPLORER).toBe(false);
    expect(FEATURE_FLAGS.ENABLE_AI_ITINERARY).toBe(false);
    expect(FEATURE_FLAGS.ENABLE_DISCOVER).toBe(false);
    expect(FEATURE_FLAGS.ENABLE_TRAVEL_JOURNAL).toBe(false);
    expect(FEATURE_FLAGS.ENABLE_GAMIFICATION).toBe(false);
    expect(FEATURE_FLAGS.ENABLE_LIVE_TRACKING).toBe(false);
  });

  it("les adresses des modules coupés sont fermées, celles des 5 outils ouvertes", () => {
    for (const p of ["/mood", "/discover", "/explore/abc", "/carnets", "/carnet/abc", "/suivi", "/gamification", "/profil-voyageur"]) {
      expect(isPathEnabled(p)).toBe(false);
    }
    for (const p of ["/guide-budget", "/guide-visa", "/guide-valise", "/guide-culture", "/guide-logement", "/app", "/offres"]) {
      expect(isPathEnabled(p)).toBe(true);
    }
  });
});

describe("création du voyage (onboarding court)", () => {
  const base = { destination: "Portugal", city: "", departureDate: "", returnDate: "", duration: "", nationality: "FR", budget: "", stayType: "erasmus" as const };

  it("calcule la durée à partir des dates", () => {
    const d = buildPrepTripData({ ...base, departureDate: "2027-02-01", returnDate: "2027-02-10" });
    expect(d.duration).toBe("10");
  });

  it("utilise la destination comme ville quand la ville est vide", () => {
    expect(buildPrepTripData(base).arrivalCity).toBe("Portugal");
  });

  it("garde la nationalité et le type de séjour pour Visa et Valise", () => {
    const d = buildPrepTripData({ ...base, nationality: "BE", stayType: "internship" });
    expect(d.nationality).toBe("BE");
    expect(d.stayType).toBe("internship");
    expect(d.tripTypes).toEqual(["Stage professionnel"]);
  });

  it("refuse un voyage sans dates ni durée", () => {
    expect(validateTravelBasics(buildPrepTripData(base))).toBe("travelForm.validation.duration");
    expect(validateTravelBasics(buildPrepTripData({ ...base, duration: "30" }))).toBeNull();
  });
});

describe("progression par outil", () => {
  beforeEach(() => localStorage.clear());

  it("Valise : éléments cochés sur le total", () => {
    saveModuleProgress("valise", "Portugal", { done: 12, total: 30 });
    expect(readTripProgress({ destination: "Portugal" }).valise).toEqual({ done: 12, total: 30 });
  });

  it("Culture : compte les 5 thèmes du parcours, pour le pays du voyage seulement", () => {
    localStorage.setItem("xplania-culture-progress", JSON.stringify({ "PT:greetings": true, "PT:food": true, "PT:popculture": true, "JP:work": true }));
    // Erasmus → parcours « Je pars étudier » : greetings compte, food et popculture sont des suggestions.
    expect(readTripProgress({ destination: "Portugal", stayType: "erasmus" }).culture).toEqual({ done: 1, total: 5 });
    // Stage → parcours « Je pars en stage ».
    expect(readTripProgress({ destination: "Portugal", stayType: "internship" }).culture).toEqual({ done: 1, total: 5 });
  });

  it("Budget : 2 étapes (budget estimé, première dépense)", () => {
    localStorage.setItem("xplania-budget-state::Portugal::na", JSON.stringify({ hasGenerated: true, expenses: [{}] }));
    expect(readTripProgress({ destination: "Portugal" }).budget).toEqual({ done: 2, total: 2 });
  });

  it("un outil pas commencé compte 0 % dans la préparation globale", () => {
    saveModuleProgress("valise", "Portugal", { done: 30, total: 30 });
    expect(overallPercent(readTripProgress({ destination: "Portugal" }))).toBe(20);
  });
});
