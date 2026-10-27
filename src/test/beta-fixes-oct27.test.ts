import { describe, expect, it } from "vitest";
import { activityChecklist, cleanActivities } from "@/lib/valise-activities";
import { buildCategories } from "@/pages/guide-valise-data";
import { isTransportMode } from "@/components/valise/TransportSelector";
import { localDateFor } from "@/lib/country-timezone";
import { getTipOfDay } from "@/data/culture-guide";
import { HOUSING_TYPES } from "@/lib/housing";
import { emptyPrepAnswers } from "@/lib/prep-quiz";
import fr from "@/i18n/locales/fr.json";
import i18n from "@/i18n";

describe("questionnaire — aucune destination imposée", () => {
  it("un nouveau questionnaire démarre sans pays de destination ni nationalité", () => {
    const a = emptyPrepAnswers();
    expect(a.destinationCode).toBe("");
    expect(a.nationality).toBe("");
  });
});

describe("valise — activités et vélo", () => {
  it("les activités choisies ajoutent leurs affaires, sans rien cocher", () => {
    const cats = activityChecklist(["hiking", "beach"], "", false);
    const items = Object.values(cats).flat();
    expect(items.some((i) => i.name === "Chaussures de randonnée")).toBe(true);
    expect(items.some((i) => i.name === "Maillot de bain")).toBe(true);
    expect(items.every((i) => !i.checked)).toBe(true);
  });

  it("une activité personnalisée apparaît dans la liste", () => {
    const items = Object.values(activityChecklist([], "surf", false)).flat();
    expect(items).toHaveLength(1);
    expect(items[0].name).toContain("surf");
  });

  it("seules les activités connues sont gardées", () => {
    expect(cleanActivities(["study", "hacker", "study", 3])).toEqual(["study"]);
  });

  it("le vélo est un transport valide qui ajoute casque et éclairage", async () => {
    await i18n.changeLanguage("fr");
    expect(isTransportMode("velo")).toBe(true);
    const cats = buildCategories("erasmus", "velo");
    const names = Object.values(cats).flat().map((i) => i.name);
    expect(names).toContain("Casque");
    expect(names).toContain("Éclairage avant et arrière");
  });
});

describe("guide culturel — geste du jour", () => {
  it("la date suit le fuseau de la destination", () => {
    // 27 oct. 2026 à 20 h UTC : déjà le 28 à Tokyo, encore le 27 à Madrid.
    const now = new Date("2026-10-27T20:00:00Z");
    expect(localDateFor("JP", now)).toBe("2026-10-28");
    expect(localDateFor("ES", now)).toBe("2026-10-27");
  });

  it("le même geste toute la journée, un autre le lendemain", () => {
    const a = getTipOfDay("ES", "fr", "study", "2026-10-27");
    const b = getTipOfDay("ES", "fr", "study", "2026-10-27");
    const c = getTipOfDay("ES", "fr", "study", "2026-10-28");
    expect(a?.tip.text).toBe(b?.tip.text);
    expect(c?.tip.text).not.toBe(a?.tip.text);
  });
});

describe("logement — types modifiables", () => {
  it("hôtel fait partie des types de logement proposés et traduits", () => {
    expect(HOUSING_TYPES).toContain("hotel");
    expect((fr as { housing: { types: Record<string, string> } }).housing.types.hotel).toBeTruthy();
  });
});

describe("budget — texte des recommandations", () => {
  it("la phrase « Xplania t'aide, mais ne remplace pas… » a disparu, la précédente reste", () => {
    const text = (fr as { budget: { disclaimerAdjust: string } }).budget.disclaimerAdjust;
    expect(text).not.toContain("ne remplace pas");
    expect(text).toContain("Revérifie toujours tes dépenses et les prix réels.");
  });
});

import { pickPlace } from "../../supabase/functions/_shared/place-lookup";

describe("météo — lieu mesuré", () => {
  it("une île (Gran Canaria) est rattachée à une ville ou à son aéroport, pas au sommet", () => {
    const picked = pickPlace([
      { name: "Grande Canarie", feature_code: "ISL", elevation: 1682 },
      { name: "Aéroport de Gran Canaria", feature_code: "AIRP", elevation: 23 },
    ]);
    expect(picked?.name).toBe("Aéroport de Gran Canaria");
  });
  it("une ville reste la ville choisie", () => {
    expect(pickPlace([{ name: "Madrid", feature_code: "PPLC", elevation: 667 }])?.name).toBe("Madrid");
  });
});
