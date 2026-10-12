import { describe, expect, it } from "vitest";
import { validateTravelBasics } from "./travel-form-validation";
import { defaultFormData } from "@/components/xplania/travel-form.config";

const valid = { ...defaultFormData, destination: "Portugal", arrivalCity: "Lisbonne", duration: "4 jours" };
describe("travel basics", () => {
  it("rejects missing country and arrival city", () => {
    expect(validateTravelBasics(defaultFormData)).toBe("travelForm.validation.destination");
    expect(validateTravelBasics({ ...valid, arrivalCity: " " })).toBe("travelForm.validation.destination");
  });
  it("requires valid duration without both dates", () => {
    for (const duration of ["", "0", "-2", "abc"]) {
      expect(validateTravelBasics({ ...valid, duration })).toBe("travelForm.validation.duration");
    }
    expect(validateTravelBasics(valid)).toBeNull();
  });
  it("rejects reversed dates but accepts a same-day trip", () => {
    expect(validateTravelBasics({ ...valid, departureDate: "2026-11-10", returnDate: "2026-11-09" })).toBe("travelForm.validation.dates");
    expect(validateTravelBasics({ ...valid, duration: "", departureDate: "2026-11-10", returnDate: "2026-11-10" })).toBeNull();
  });
});