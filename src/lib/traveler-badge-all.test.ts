import { describe, expect, it } from "vitest";
import fr from "@/i18n/locales/fr.json";
import en from "@/i18n/locales/en.json";
import {
  BADGE_FEATURES,
  BADGE_REWARDS,
  TRAVELER_DIMENSIONS,
  calculateBadge,
  emptyScores,
  recomputeRecommendedFeatures,
  type TravelerBadgeKey,
} from "./traveler-badge";

const ALL = Object.keys(BADGE_FEATURES) as TravelerBadgeKey[];

describe("quiz ADN Voyageur — tous les résultats", () => {
  it("chaque paire de goûts dominants donne un profil valide", () => {
    const seen = new Set<TravelerBadgeKey>(["curious"]);
    for (const a of TRAVELER_DIMENSIONS) {
      for (const b of TRAVELER_DIMENSIONS) {
        if (a === b) continue;
        const s = emptyScores();
        s[a] = 10;
        s[b] = 8;
        const r = calculateBadge(s);
        expect(ALL).toContain(r.key);
        expect(r.features).toHaveLength(2);
        seen.add(r.key);
      }
    }
    // Les 11 profils sont tous atteignables.
    expect([...seen].sort()).toEqual([...ALL].sort());
  });

  it("chaque profil a un nom, une description et une récompense en FR et EN", () => {
    const frB = (fr as any).travelerProfile.badges;
    const enB = (en as any).travelerProfile.badges;
    for (const k of ALL) {
      expect(frB[k]?.name, k).toBeTruthy();
      expect(frB[k]?.description, k).toBeTruthy();
      expect(enB[k]?.name, k).toBeTruthy();
      expect(enB[k]?.description, k).toBeTruthy();
      expect(BADGE_REWARDS[k].points).toBeGreaterThan(0);
    }
  });

  it("les besoins exprimés donnent toujours 2 outils différents", () => {
    for (const k of ALL) {
      for (const need of ["no_idea", "prepare_trip", "budget_fear", "want_unusual", "travel_differently", "just_curious"]) {
        const f = recomputeRecommendedFeatures(k, [need]);
        expect(f).toHaveLength(2);
        expect(f[0]).not.toBe(f[1]);
      }
    }
  });
});
