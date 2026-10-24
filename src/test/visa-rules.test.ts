import { describe, expect, it } from "vitest";
import {
  carryChecked, hasFreeMovement, healthRelevance, missingVisaFields, normalizeAnalysis, visaProfileFromTrip, visaProfileKey, visaStayDays,
} from "@/lib/visa-rules";

const complete = visaProfileFromTrip({
  destination: "Japon", nationality: "FR", residence: "FR", stayType: "erasmus",
  departureDate: "2027-02-01", returnDate: "2027-06-30", passportType: "ordinary", hasTransit: "no",
});

describe("visa rules", () => {
  it("a French student going to Spain needs no visa (EU free movement)", () => {
    expect(hasFreeMovement("ES", ["FR"])).toBe(true);
  });

  it("a Moroccan student going to Spain is not covered by free movement", () => {
    expect(hasFreeMovement("ES", ["MA"])).toBe(false);
  });

  it("a second EU nationality is enough for free movement", () => {
    expect(hasFreeMovement("DE", ["MA", "PT"])).toBe(true);
  });

  it("free movement never applies outside the EU/EEA/Switzerland", () => {
    expect(hasFreeMovement("JP", ["FR"])).toBe(false);
  });

  it("asks for passport type and transit when they are missing", () => {
    const p = visaProfileFromTrip({ destination: "Japon", nationality: "FR", residence: "FR", stayType: "erasmus", durationBucket: "3to6" });
    expect(missingVisaFields(p)).toEqual(["passportType", "transit"]);
  });

  it("a transit answer of 'yes' needs at least one country", () => {
    expect(missingVisaFields({ ...complete, hasTransit: "yes", transitCountries: [] })).toContain("transit");
    expect(missingVisaFields({ ...complete, hasTransit: "yes", transitCountries: ["AE"] })).toEqual([]);
  });

  it("counts the stay length from the dates", () => {
    expect(visaStayDays(complete)).toBe(150);
  });

  it("long-stay health advice applies from 90 days", () => {
    expect(healthRelevance("Pour des séjours longs ou répétés.", 150)).toBe("applies");
    expect(healthRelevance("Pour des séjours longs ou répétés.", 30)).toBe("check");
    expect(healthRelevance("En zone rurale pendant la période de transmission", 150)).toBe("check");
  });

  it("changing the nationality invalidates the saved analysis", () => {
    expect(visaProfileKey({ ...complete, nationality: "MA" })).not.toBe(visaProfileKey(complete));
  });

  it("keeps ticks only for items that still exist after a new analysis", () => {
    expect(carryChecked({ "passport-validity": true, "old-item": true }, [
      { id: "passport-validity", item: "Passeport", detail: "", category: "documents", priority: "required", condition: "" },
    ])).toEqual({ "passport-validity": true });
  });

  it("an unknown visa status from the AI becomes 'to check'", () => {
    const a = normalizeAnalysis({ visa: { status: "maybe" }, checklist: [] });
    expect(a?.visa.status).toBe("to_verify");
  });
});

import { entrySourceFor } from "@/data/entry-sources";
describe("sources officielles d'entrée", () => {
  it("chaque site d'entrée est sur un domaine officiel en https", () => {
    for (const c of ["GB", "US", "CA", "AU", "JP", "KR", "CN", "SG", "MX", "BR", "MA", "CH"]) {
      expect(entrySourceFor(c)?.url).toMatch(/^https:\/\//);
    }
  });
  it("les pays de l'espace Schengen/UE renvoient vers la Commission européenne", () => {
    expect(entrySourceFor("ES")?.url).toContain("home-affairs.ec.europa.eu");
  });
  it("aucun site inventé pour un pays non vérifié", () => {
    expect(entrySourceFor("ZZ")).toBeNull();
  });
});
