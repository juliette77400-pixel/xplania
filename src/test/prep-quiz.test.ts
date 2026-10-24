import { describe, expect, it } from "vitest";
import {
  PREP_STEPS, emptyPrepAnswers, validatePrepStep, firstInvalidStep, buildTripFromAnswers, stayDurationDays, answersFromTrip,
  type PrepAnswers,
} from "@/lib/prep-quiz";
import { moduleStatus, nextActionKey } from "@/lib/prep-progress";

const complete = (over: Partial<PrepAnswers> = {}): PrepAnswers => ({
  ...emptyPrepAnswers(),
  destinationCode: "ES",
  city: "Madrid",
  nationality: "FR",
  residence: "FR",
  stayType: "erasmus",
  durationBucket: "3to6",
  budgetUnknown: true,
  housing: "flatshare",
  housingStatus: "starting",
  ...over,
});
const labels = { tripType: "Erasmus / échange universitaire", accommodation: "Colocation / appartement" };

describe("questionnaire de préparation", () => {
  it("pose exactement 7 questions, la recherche de logement en dernier", () => {
    expect(PREP_STEPS).toEqual(["destination", "origin", "stay", "dates", "budget", "housing", "housingStatus"]);
  });

  it("exige une réponse sur la recherche de logement et l'enregistre dans le séjour", () => {
    expect(validatePrepStep("housingStatus", complete({ housingStatus: "" }))).toBe("prepQuiz.errors.housingStatus");
    const trip = buildTripFromAnswers(complete({ housingStatus: "confirmed" }), labels);
    expect(trip.housingStatus).toBe("confirmed");
    expect(answersFromTrip(trip, trip.destination).housingStatus).toBe("confirmed");
  });

  it("exige un pays de destination reconnu", () => {
    expect(validatePrepStep("destination", complete({ destinationCode: "" }))).toBe("prepQuiz.errors.destination");
    expect(validatePrepStep("destination", complete())).toBeNull();
  });

  it("exige nationalité et résidence, sans déduire l'une de l'autre", () => {
    expect(validatePrepStep("origin", complete({ nationality: "" }))).toBe("prepQuiz.errors.nationality");
    expect(validatePrepStep("origin", complete({ residence: "" }))).toBe("prepQuiz.errors.residence");
    const trip = buildTripFromAnswers(complete({ nationality: "BE", residence: "FR" }), labels);
    expect(trip.nationality).toBe("BE");
    expect(trip.residence).toBe("FR");
  });

  it("accepte « Je ne sais pas encore » pour les dates", () => {
    expect(validatePrepStep("dates", complete({ durationBucket: "unknown" }))).toBeNull();
    expect(validatePrepStep("dates", complete({ durationBucket: "" }))).toBe("prepQuiz.errors.datesMissing");
    expect(stayDurationDays({ departureDate: "", returnDate: "", durationBucket: "unknown" })).toBe("");
  });

  it("refuse une date de retour avant le départ", () => {
    expect(validatePrepStep("dates", complete({ departureDate: "2027-02-10", returnDate: "2027-02-01" }))).toBe("prepQuiz.errors.dates");
  });

  it("calcule la durée à partir des dates", () => {
    expect(stayDurationDays({ departureDate: "2027-02-01", returnDate: "2027-02-10", durationBucket: "" })).toBe("10");
  });

  it("ne rend pas le budget obligatoire", () => {
    expect(validatePrepStep("budget", complete({ budgetUnknown: true, budget: "" }))).toBeNull();
    expect(validatePrepStep("budget", complete({ budgetUnknown: false, budget: "" }))).toBe("prepQuiz.errors.budget");
    expect(buildTripFromAnswers(complete({ budgetUnknown: true, budget: "3000" }), labels).totalBudget).toBe(0);
    expect(buildTripFromAnswers(complete({ budgetUnknown: false, budget: "3000" }), labels).totalBudget).toBe(3000);
  });

  it("enregistre les réponses utilisées par les quatre guides", () => {
    const trip = buildTripFromAnswers(complete(), labels);
    expect(trip.destination).toBeTruthy();
    expect(trip.arrivalCity).toBe("Madrid");
    expect(trip.stayType).toBe("erasmus");
    expect(trip.tripTypes).toEqual(["Erasmus / échange universitaire"]);
    expect(trip.accommodationType).toBe("Colocation / appartement");
    expect(firstInvalidStep(complete())).toBeNull();
  });

  it("relit un séjour enregistré pour le modifier", () => {
    const trip = buildTripFromAnswers(complete({ secondNationality: "IT" }), labels);
    const back = answersFromTrip(trip, trip.destination);
    expect(back.destinationCode).toBe("ES");
    expect(back.secondNationality).toBe("IT");
    expect(back.housing).toBe("flatshare");
  });
});

describe("statut des guides sur le tableau de bord", () => {
  it("une page seulement consultée reste « Non commencé »", () => {
    expect(moduleStatus({ done: 0, total: 0 })).toBe("notStarted");
    expect(moduleStatus({ done: 0, total: 12 })).toBe("notStarted");
  });
  it("passe à « En cours » puis « Terminé » selon les actions enregistrées", () => {
    expect(moduleStatus({ done: 3, total: 12 })).toBe("inProgress");
    expect(moduleStatus({ done: 12, total: 12 })).toBe("done");
  });
  it("ne propose plus d'action pour un guide terminé", () => {
    expect(nextActionKey("visa", { done: 5, total: 5 })).toBeNull();
    expect(nextActionKey("budget", { done: 0, total: 2 })).toBe("prepDashboard.next.budgetStart");
  });
});
