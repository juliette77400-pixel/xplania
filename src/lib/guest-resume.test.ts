import { describe, expect, it } from "vitest";
import { buildTripFromAnswers, emptyPrepAnswers, hasCompleteGuestDraft, GUEST_DRAFT_KEY } from "@/lib/prep-quiz";
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
