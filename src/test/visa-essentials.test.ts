import { describe, it, expect } from "vitest";
import { missingEssentials, withEssentials, type EssentialContext } from "@/lib/visa-essentials";
import type { VisaChecklistItem } from "@/lib/visa-rules";

const item = (id: string, text: string): VisaChecklistItem => ({ id, item: text, detail: "", category: "documents", priority: "required", condition: "" });
const t = (k: string) => k;
const base: EssentialContext = { days: 180, stayType: "erasmus", freeMovement: false, isFrench: false };
const ids = (items: VisaChecklistItem[], ctx: EssentialContext) => missingEssentials(items, ctx).map((r) => r.id);

describe("visa essentials", () => {
  it("adds the passport, health cover, admission proof and copies when the AI forgot them", () => {
    expect(ids([], base)).toEqual(expect.arrayContaining(["passport-validity", "health-insurance", "admission-proof", "document-copies"]));
  });

  it("does not repeat a point the AI already covered, in French or English", () => {
    const list = [item("a", "Passeport valide"), item("b", "Assurance santé internationale"), item("c", "Convention de stage signée"), item("d", "Scan of your documents")];
    expect(ids(list, base)).not.toEqual(expect.arrayContaining(["passport-validity"]));
    expect(ids(list, base)).not.toContain("health-insurance");
    expect(ids(list, base)).not.toContain("admission-proof");
    expect(ids(list, base)).not.toContain("document-copies");
  });

  it("asks to register residence only for stays longer than 3 months", () => {
    expect(ids([], { ...base, days: 91 })).toContain("residence-registration");
    expect(ids([], { ...base, days: 90 })).not.toContain("residence-registration");
  });

  it("asks for an internship authorisation only for internships without free movement", () => {
    expect(ids([], { ...base, stayType: "internship" })).toContain("internship-authorisation");
    expect(ids([], { ...base, stayType: "internship", freeMovement: true })).not.toContain("internship-authorisation");
    expect(ids([], base)).not.toContain("internship-authorisation");
  });

  it("suggests Ariane only to French nationals", () => {
    expect(ids([], { ...base, isFrench: true })).toContain("ariane");
    expect(ids([], base)).not.toContain("ariane");
  });

  it("uses the European card text only with free movement", () => {
    const eu = withEssentials([], { ...base, freeMovement: true }, t).find((i) => i.id === "essential-health-insurance");
    const world = withEssentials([], base, t).find((i) => i.id === "essential-health-insurance");
    expect(eu?.detail).toBe("visa2.essentials.health-insurance.detail");
    expect(world?.detail).toBe("visa2.essentials.health-insurance.detailWorld");
  });

  it("is idempotent", () => {
    const once = withEssentials([], { ...base, isFrench: true }, t);
    expect(withEssentials(once, { ...base, isFrench: true }, t)).toHaveLength(once.length);
  });
  it("reminds about the residence permit only to students living outside their nationality's country without free movement", () => {
    // Moroccan student living in France
    expect(ids([], { ...base, residenceDiffers: true, residenceFreeMovement: false })).toContain("residence-permit-return");
    // French student living in France
    expect(ids([], { ...base, residenceDiffers: false })).not.toContain("residence-permit-return");
    // Italian student living in France (free movement: no permit)
    expect(ids([], { ...base, residenceDiffers: true, residenceFreeMovement: true })).not.toContain("residence-permit-return");
    expect(ids([item("a", "Vérifie ton titre de séjour français")], { ...base, residenceDiffers: true })).not.toContain("residence-permit-return");
  });

  it("lists EU registration papers only for free-movement stays over 3 months, never as mandatory", () => {
    const eu = { ...base, freeMovement: true };
    expect(ids([], { ...eu, days: 150 })).toContain("eu-registration-documents");
    expect(ids([], { ...eu, days: 90 })).not.toContain("eu-registration-documents");
    expect(ids([], { ...base, days: 150 })).not.toContain("eu-registration-documents");
    const added = withEssentials([], { ...eu, days: 150 }, t).find((i) => i.id === "essential-eu-registration-documents");
    expect(added?.priority).toBe("if_applicable");
    expect(added?.condition).toBe("visa2.essentials.eu-registration-documents.condition");
    const intern = withEssentials([], { ...eu, days: 150, stayType: "internship" }, t).find((i) => i.id === "essential-eu-registration-documents");
    expect(intern?.detail).toBe("visa2.essentials.eu-registration-documents.detailInternship");
  });
});
