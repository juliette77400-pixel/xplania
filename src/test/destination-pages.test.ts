import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { DESTINATION_PAGES, destinationPath } from "@/data/destination-pages";
import { hasPrewritten } from "@/data/culture-guide";
import { META, NOINDEX_ROUTES } from "@/lib/route-meta.data";

const sitemap = readFileSync(resolve(__dirname, "../../public/sitemap.xml"), "utf-8");

describe("guides par pays", () => {
  it("chaque guide repose sur une fiche culturelle déjà rédigée (pas d'IA)", () => {
    for (const d of DESTINATION_PAGES) expect(hasPrewritten(d.code, "greetings") || hasPrewritten(d.code, "social") || hasPrewritten(d.code, "work")).toBe(true);
  });
  it("chaque guide a son titre, sa description et figure dans le plan du site", () => {
    for (const d of DESTINATION_PAGES) {
      expect(META[destinationPath(d)]).toBeTruthy();
      expect(sitemap).toContain(`<loc>https://xplania.app${destinationPath(d)}</loc>`);
    }
  });
  it("le plan du site n'a aucune entrée vide ni de page réservée aux comptes", () => {
    const urls = sitemap.match(/<url>[\s\S]*?<\/url>/g) || [];
    for (const u of urls) expect(u).toMatch(/<loc>https:\/\/xplania\.app\//);
    for (const r of NOINDEX_ROUTES) expect(sitemap).not.toContain(`<loc>https://xplania.app${r}</loc>`);
  });
});
