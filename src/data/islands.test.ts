import { describe, it, expect } from "vitest";
import { islandFor, islandsOf } from "./islands";
import { findCountry } from "@/lib/country-match";
import { guessCurrency } from "@/lib/currency";
import { getCityProfile } from "@/lib/cost-of-living";
import { resourcesForCountry } from "./housing-resources";

describe("îles et outre-mer", () => {
  it("reconnaît l'île dans la ville d'arrivée ou la destination", () => {
    expect(islandFor("Espagne", "Santa Cruz de Tenerife")?.id).toBe("canaries");
    expect(islandFor("Espagne", "Palma de Majorque")?.id).toBe("baleares");
    expect(islandFor("Réunion", "", "RE")?.id).toBe("drom");
    expect(islandFor("Polynésie française", "Papeete", "PF")?.id).toBe("pacific");
    expect(islandFor("Espagne", "Madrid")).toBeNull();
  });

  it("une île tapée seule appartient à son pays", () => {
    expect(findCountry("Tenerife")).toBe("ES");
    expect(findCountry("Bali")).toBe("ID");
    expect(findCountry("Réunion")).toBe("RE");
  });

  it("monnaie : euro dans les DOM, franc Pacifique en Nouvelle-Calédonie et Polynésie", () => {
    expect(guessCurrency("Réunion")).toBe("EUR");
    expect(guessCurrency("Nouvelle-Calédonie")).toBe("XPF");
    expect(guessCurrency("Polynésie française")).toBe("XPF");
  });

  it("le Budget ne calcule pas l'outre-mer comme Paris", () => {
    expect(getCityProfile("Polynésie française").currency).toBe("XPF");
    expect(getCityProfile("Réunion").flight).toBeGreaterThan(500);
  });

  it("les DOM (sauf Mayotte) reçoivent les ressources logement françaises", () => {
    expect(resourcesForCountry("RE").local.some((r) => r.id === "caf")).toBe(true);
    expect(resourcesForCountry("YT").local).toEqual([]);
  });

  it("les guides Espagne et Grèce listent leurs îles", () => {
    expect(islandsOf("ES").map((i) => i.id)).toEqual(["canaries", "baleares"]);
    expect(islandsOf("GR").map((i) => i.id)).toEqual(["greek_islands"]);
  });
});
