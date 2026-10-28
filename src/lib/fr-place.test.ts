import { describe, it, expect } from "vitest";
import i18n from "@/i18n";
import { frFor, frIn, frOf, frTo } from "./fr-place";

describe("noms de lieux en français", () => {
  it("accorde la préposition au pays", () => {
    expect(frIn("Espagne")).toBe("en Espagne");
    expect(frIn("Japon")).toBe("au Japon");
    expect(frIn("Mexique")).toBe("au Mexique");
    expect(frIn("États-Unis d'Amérique")).toBe("aux États-Unis");
    expect(frIn("Pays-Bas")).toBe("aux Pays-Bas");
    expect(frIn("Corée du Sud")).toBe("en Corée du Sud");
    expect(frIn("Iran")).toBe("en Iran");
    expect(frIn("Cuba")).toBe("à Cuba");
    expect(frIn("Réunion")).toBe("à La Réunion");
    expect(frIn("Madrid")).toBe("à Madrid");
    expect(frIn("Gran Canaria, Espagne")).toBe("à Gran Canaria");
  });
  it("pour / de / à", () => {
    expect(frFor("Espagne")).toBe("pour l'Espagne");
    expect(frFor("Portugal")).toBe("pour le Portugal");
    expect(frOf("Japon")).toBe("du Japon");
    expect(frOf("Amsterdam")).toBe("d'Amsterdam");
    expect(frTo("Japon")).toBe("au Japon");
    expect(frTo("Espagne")).toBe("à l'Espagne");
  });
  it("les titres des outils ne disent plus « pour Espagne »", async () => {
    await i18n.changeLanguage("fr");
    expect(i18n.t("visa2.titleFor", { destination: "Espagne" })).toBe("Tes formalités pour l'Espagne");
    expect(i18n.t("valise.heroTitleB", { destination: "Espagne" })).toBe("ta valise pour l'Espagne");
    await i18n.changeLanguage("en");
    expect(i18n.t("valise.heroTitleB", { destination: "Spain" })).toBe("your bag for Spain");
  });
});
