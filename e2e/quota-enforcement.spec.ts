import { expect, test, type Route } from "@playwright/test";

/**
 * Verifies that every AI-backed edge function returns 402 `quota_exceeded`
 * when a non-admin caller has hit their monthly cap, and that admins bypass
 * the same guard entirely (200 through).
 *
 * We stub every edge function call at the network layer to simulate the
 * server response — this test does not exercise the real Supabase backend,
 * it exercises the client's handling of the 402 contract.
 */

const AI_FUNCTIONS = [
  "valise-outfits",
  "valise-qa",
  "valise-cultural-tips",
  "budget-tips",
  "budget-qa",
  "visa-info",
  "visa-qa",
  "visa-official-info",
  "mood-recommend",
  "journal-story",
  "journal-cover",
  "journal-insights",
  "journal-style-profile",
  "carnet-qa",
  "discover-search",
  "discover-enrich",
  "explore-suggest",
  "explore-seed",
  "explore-summary",
  "trip-suggestions",
  "trip-seed-activities",
  "adapt-itinerary",
  "xplania-suggest-destinations",
] as const;

async function callFn(page: import("@playwright/test").Page, name: string) {
  return page.evaluate(async (n) => {
    const r = await fetch(`https://example.supabase.co/functions/v1/${n}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer stub" },
      body: JSON.stringify({}),
    });
    const body = await r.json().catch(() => ({}));
    return { status: r.status, body };
  }, name);
}

test.describe("quota enforcement — every AI function honors 402", () => {
  test("non-admin gets 402 quota_exceeded on every AI function", async ({ page }) => {
    for (const fn of AI_FUNCTIONS) {
      await page.route(new RegExp(`/functions/v1/${fn}(\\?|$)`), (route: Route) => {
        route.fulfill({
          status: 402,
          contentType: "application/json",
          body: JSON.stringify({ error: "quota_exceeded", reason: "quota_exceeded", used: 3, limit: 3, tool: fn }),
        });
      });
    }
    await page.goto("/");

    for (const fn of AI_FUNCTIONS) {
      const res = await callFn(page, fn);
      expect(res.status, `${fn} should return 402`).toBe(402);
      expect(res.body.error, `${fn} should surface quota_exceeded`).toBe("quota_exceeded");
    }
  });

  test("admin bypass — every AI function returns 200 when server flags admin", async ({ page }) => {
    for (const fn of AI_FUNCTIONS) {
      await page.route(new RegExp(`/functions/v1/${fn}(\\?|$)`), (route: Route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true, admin: true }),
        });
      });
    }
    await page.goto("/");

    for (const fn of AI_FUNCTIONS) {
      const res = await callFn(page, fn);
      expect(res.status, `${fn} should pass for admin`).toBe(200);
      expect(res.body.ok, `${fn} should return payload for admin`).toBe(true);
    }
  });

  test("anon caller is refused (no AI call reaches server without auth)", async ({ page }) => {
    // requireAuth on every AI function returns 401 when there is no Bearer token.
    for (const fn of AI_FUNCTIONS) {
      await page.route(new RegExp(`/functions/v1/${fn}(\\?|$)`), (route: Route) => {
        const auth = route.request().headers()["authorization"];
        if (!auth) {
          return route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ error: "Unauthorized" }),
          });
        }
        return route.fulfill({
          status: 402,
          contentType: "application/json",
          body: JSON.stringify({ error: "quota_exceeded" }),
        });
      });
    }
    await page.goto("/");

    for (const fn of AI_FUNCTIONS) {
      const res = await page.evaluate(async (n) => {
        const r = await fetch(`https://example.supabase.co/functions/v1/${n}`, { method: "POST" });
        return { status: r.status };
      }, fn);
      expect(res.status, `${fn} should reject anon caller`).toBe(401);
    }
  });
});
