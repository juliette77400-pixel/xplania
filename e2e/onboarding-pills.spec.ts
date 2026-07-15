import { expect, test, type Route } from "@playwright/test";

/**
 * E2E coverage for the category pill filter behavior on the Tinder onboarding.
 *
 * We stub the Supabase `tinder_cards` endpoint so the deck is deterministic:
 * 2 immersion cards, 2 budget cards, 1 transport card (5 total).
 * We pre-fill localStorage with swipes on the 2 immersion cards so that
 * "immersion" reads as complete and must render as disabled.
 */

const CARDS = [
  { id: "im-1", name: "im-1", image_url: null, phrase_fr: "Immersion 1", phrase_en: "Immersion 1", score_tags: { culture: 2 }, order_index: 1, active: true },
  { id: "im-2", name: "im-2", image_url: null, phrase_fr: "Immersion 2", phrase_en: "Immersion 2", score_tags: { culture: 2 }, order_index: 2, active: true },
  { id: "bg-1", name: "bg-1", image_url: null, phrase_fr: "Budget 1",    phrase_en: "Budget 1",    score_tags: { budget: 2 },  order_index: 3, active: true },
  { id: "bg-2", name: "bg-2", image_url: null, phrase_fr: "Budget 2",    phrase_en: "Budget 2",    score_tags: { budget: 2 },  order_index: 4, active: true },
  { id: "tr-1", name: "tr-1", image_url: null, phrase_fr: "Transport 1", phrase_en: "Transport 1", score_tags: { nomad: 2 },   order_index: 5, active: true },
];

async function setupDeck(page: import("@playwright/test").Page) {
  // Stub every Supabase REST call. We only care about `tinder_cards`; anything
  // else (user_swipes, traveler_profiles) is answered with an empty array so
  // the page never errors out in anonymous mode.
  await page.route(/\/rest\/v1\/tinder_cards/, (route: Route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CARDS) });
  });
  await page.route(/\/rest\/v1\/(user_swipes|traveler_profiles|user_roles)/, (route: Route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  // Silence any Supabase auth/session probe.
  await page.route(/\/auth\/v1\//, (route: Route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  // Pre-swipe both immersion cards so that category is complete.
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "xplania:onboarding",
      JSON.stringify({
        session_id: "e2e",
        step: "tinder",
        swipes: [
          { card_id: "im-1", direction: "right" },
          { card_id: "im-2", direction: "left" },
        ],
      }),
    );
  });
}

test.describe("onboarding pill filters", () => {
  test("filter toggles on click and clears on second click", async ({ page }) => {
    await setupDeck(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const budgetPill = page.getByRole("button", { name: /Budget\s+—\s+0\/2/ });
    await expect(budgetPill).toBeVisible();
    await expect(budgetPill).toHaveAttribute("aria-pressed", "false");

    // First click enables the filter.
    await budgetPill.click();
    await expect(budgetPill).toHaveAttribute("aria-pressed", "true");

    // Second click on the same pill clears the filter.
    await budgetPill.click();
    await expect(budgetPill).toHaveAttribute("aria-pressed", "false");
  });

  test("switching pill moves the filter without lingering state", async ({ page }) => {
    await setupDeck(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const budgetPill = page.getByRole("button", { name: /Budget\s+—\s+0\/2/ });
    const transportPill = page.getByRole("button", { name: /Transport\s+—\s+0\/1/ });

    await budgetPill.click();
    await expect(budgetPill).toHaveAttribute("aria-pressed", "true");

    await transportPill.click();
    await expect(transportPill).toHaveAttribute("aria-pressed", "true");
    await expect(budgetPill).toHaveAttribute("aria-pressed", "false");
  });

  test("completed category pill is disabled and cannot toggle a filter", async ({ page }) => {
    await setupDeck(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const immersionPill = page.getByRole("button", { name: /Immersion\s+—\s+2\/2\s+\(terminé\)/ });
    await expect(immersionPill).toBeVisible();
    await expect(immersionPill).toBeDisabled();
    await expect(immersionPill).toHaveAttribute("aria-pressed", "false");

    // Force-clicking must not activate the filter (aria-pressed stays false).
    await immersionPill.click({ force: true }).catch(() => {
      /* disabled buttons swallow the click — that's the point */
    });
    await expect(immersionPill).toHaveAttribute("aria-pressed", "false");
  });
});
