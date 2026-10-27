import { describe, expect, it } from "vitest";
import { buildTripFromAnswers, emptyPrepAnswers, hasCompleteGuestDraft, GUEST_DRAFT_KEY, cleanFinishedAnswers, finishedGuestAnswers, answersMatchTrip } from "@/lib/prep-quiz";
import { missingVisaFields, visaProfileFromTrip } from "@/lib/visa-rules";

const store = (value: string | null) => ({ getItem: (k: string) => (k === GUEST_DRAFT_KEY ? value : null) });

describe("visitor answers come back after signup", () => {
  it("detects finished visitor answers so sign-up returns to the questionnaire", () => {
    expect(hasCompleteGuestDraft(store(JSON.stringify({ answers: {}, step: 6, complete: true })))).toBe(true);
  });
  it("ignores unfinished or missing answers", () => {
    expect(hasCompleteGuestDraft(store(JSON.stringify({ answers: {}, step: 2 })))).toBe(false);
    expect(hasCompleteGuestDraft(store(null))).toBe(false);
    expect(hasCompleteGuestDraft(store("{broken"))).toBe(false);
  });
});

describe("Visa profile of a trip created by the questionnaire", () => {
  it("only lacks the passport type and the stopover, which the questionnaire does not ask", () => {
    const trip = buildTripFromAnswers(
      { ...emptyPrepAnswers(), destinationCode: "JP", nationality: "MA", residence: "FR", stayType: "internship", departureDate: "2027-02-01", returnDate: "2027-06-30" },
      { tripType: "Stage", accommodation: "" },
    );
    expect(missingVisaFields(visaProfileFromTrip(trip)).sort()).toEqual(["passportType", "transit"]);
  });
});

describe("answers confirmed on another device", () => {
  const finished = { destinationCode: "ES", nationality: "FR", residence: "FR", stayType: "erasmus", departureDate: "2027-01-20", returnDate: "2027-06-30", budget: "900", housing: "residence", housingStatus: "starting", city: "Madrid" };

  it("keeps finished answers sent with the signup", () => {
    const a = cleanFinishedAnswers(finished);
    expect(a?.destinationCode).toBe("ES");
    expect(a?.budget).toBe("900");
  });
  it("rejects unfinished or tampered answers", () => {
    expect(cleanFinishedAnswers({ ...finished, housingStatus: "" })).toBeNull();
    expect(cleanFinishedAnswers({ ...finished, stayType: "<script>" })).toBeNull();
    expect(cleanFinishedAnswers("ES")).toBeNull();
    expect(cleanFinishedAnswers(null)).toBeNull();
  });
  it("reads finished answers from this browser for the signup", () => {
    expect(finishedGuestAnswers(store(JSON.stringify({ answers: finished, step: 6, complete: true })))?.destinationCode).toBe("ES");
    expect(finishedGuestAnswers(store(JSON.stringify({ answers: finished, step: 3 })))).toBeNull();
  });
  it("does not create the same trip twice when both devices resume", () => {
    const a = cleanFinishedAnswers(finished)!;
    expect(answersMatchTrip(a, [{ destination: "Espagne", departure_date: "2027-01-20" }])).toBe(true);
    expect(answersMatchTrip(a, [{ destination: "Espagne", departure_date: "2027-03-01" }])).toBe(false);
  });
});
