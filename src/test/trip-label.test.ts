import { describe, expect, it } from "vitest";
import { tripLabels } from "@/lib/trip-label";

describe("noms des séjours sur le tableau de bord", () => {
  it("affiche la ville et le pays", () => {
    expect(tripLabels([{ id: "a", destination: "Japon", arrival_city: "Kyoto" }], "fr", "?")).toEqual({ a: "Kyoto, Japon" });
  });
  it("deux séjours au même endroit sont distingués par le mois de départ", () => {
    const l = tripLabels([
      { id: "a", destination: "Japon", departure_date: "2027-02-01" },
      { id: "b", destination: "Japon", departure_date: "2027-09-01" },
      { id: "c", destination: "Australie" },
    ], "fr", "?");
    expect(l.a).not.toBe(l.b);
    expect(l.a.startsWith("Japon · ")).toBe(true);
    expect(l.c).toBe("Australie");
  });
  it("même endroit et même mois : numérotés", () => {
    const l = tripLabels([
      { id: "a", destination: "Japon", departure_date: "2027-02-01" },
      { id: "b", destination: "Japon", departure_date: "2027-02-10" },
    ], "fr", "?");
    expect(l.a.endsWith("(1)")).toBe(true);
    expect(l.b.endsWith("(2)")).toBe(true);
  });
});
