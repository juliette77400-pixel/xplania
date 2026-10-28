import { describe, expect, it } from "vitest";
import { CHECKED_LINKS } from "../../supabase/functions/_shared/checked-links";
import { classifyLink } from "../../supabase/functions/_shared/link-outcome";
import { linkState, summarizeLinks, type LinkCheck } from "@/lib/link-checks";
import { HOUSING_RESOURCES } from "@/data/housing-resources";
import { entrySourceFor } from "@/data/entry-sources";
import { DESTINATION_PAGES, franceDiplomatieEntryUrl, pasteurUrl } from "@/data/destination-pages";
import { countryList } from "@/lib/countries";
import { ISLAND_LINKS } from "@/data/islands";

describe("vérification quotidienne des liens", () => {
  it("chaque lien affiché dans l'app est dans la liste testée chaque jour", () => {
    const shown = new Set<string>();
    HOUSING_RESOURCES.forEach((r) => shown.add(r.url));
    countryList.forEach((c) => { const e = entrySourceFor(c.code); if (e) shown.add(e.url); });
    DESTINATION_PAGES.forEach((d) => { shown.add(franceDiplomatieEntryUrl(d)); shown.add(pasteurUrl(d)); });
    ISLAND_LINKS.forEach((u) => shown.add(u));
    const missing = [...shown].filter((u) => !CHECKED_LINKS.includes(u));
    expect(missing).toEqual([]);
  });

  it("une page 404 est cassée, une redirection vers un autre site est signalée", () => {
    expect(classifyLink("https://a.fr/x", 200, "https://www.a.fr/x/")).toBe("ok");
    expect(classifyLink("https://a.fr/x", 404, "https://a.fr/x")).toBe("broken");
    expect(classifyLink("https://a.fr/x", 200, "https://autre-site.com/")).toBe("moved");
    expect(classifyLink("https://a.fr/x", 403, "https://a.fr/x")).toBe("blocked");
    expect(classifyLink("https://a.fr/x", null, null)).toBe("error");
  });

  const row = (url: string, outcome: LinkCheck["outcome"], last_success_at: string | null): LinkCheck =>
    ({ url, outcome, last_checked_at: "2026-10-28T04:00:00Z", last_success_at });

  it("un échec garde l'ancienne date réussie et demande une nouvelle vérification", () => {
    const s = linkState(row("u", "broken", "2026-10-27T04:00:00Z"));
    expect(s).toEqual({ state: "recheck", lastSuccessAt: "2026-10-27T04:00:00Z" });
  });

  it("aucune date « tout est OK » n'est affichée si un lien du groupe a échoué", () => {
    const checks = {
      a: row("a", "ok", "2026-10-28T04:00:00Z"),
      b: row("b", "broken", "2026-10-27T04:00:00Z"),
    };
    expect(summarizeLinks(["a", "b"], checks).allOkSince).toBeNull();
    expect(summarizeLinks(["a", "b"], checks).recheck).toEqual(["b"]);
  });

  it("la date affichée pour un groupe est la plus ancienne réussite, jamais une date inventée", () => {
    const checks = {
      a: row("a", "ok", "2026-10-28T04:00:00Z"),
      b: row("b", "ok", "2026-10-27T04:00:00Z"),
    };
    expect(summarizeLinks(["a", "b"], checks).allOkSince).toBe("2026-10-27T04:00:00Z");
    expect(summarizeLinks(["c"], checks).allOkSince).toBeNull();
  });
});
