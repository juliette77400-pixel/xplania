import { expect, test, type Route } from "@playwright/test";

/**
 * E2E coverage for admin bypass and freemium paywall.
 *
 * Strategy: seed a completed traveler profile in localStorage (anonymous
 * mode) so we can land on `/profil-voyageur/resultat` without a real
 * Supabase session, then compare two runs — one with the client-side
 * admin flag OFF (the visitor is a normal freemium user) and one with
 * the flag ON (the visitor is a server-verified admin).
 *
 * The client-side flag is only the *presentation* layer. Real bypass is
 * enforced server-side (`consume_quota`, `can_retake_quiz`, RLS on
 * `user_roles`), which is why we ALSO stub the relevant RPCs to match
 * each scenario.
 */

const LOCAL_ONBOARDING = {
  session_id: "e2e-admin",
  step: "resultat",
  result: {
    badge: "curious",
    scores: {
      culture: 80, nature: 40, gastronomy: 30, adventure: 20,
      relaxation: 50, budget: 30, luxury: 30, nomad: 40,
    },
    features: ["discover", "mood"],
    reward_points: 100,
    reward_unlocks: ["title"],
  },
};

async function stubBackend(page: import("@playwright/test").Page, opts: { admin: boolean }) {
  // Answer every REST probe with an empty payload so the page never errors.
  await page.route(/\/rest\/v1\/(user_swipes|traveler_profiles|user_roles|quiz_completions|usage_counters|profiles)/, (route: Route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route(/\/auth\/v1\//, (route: Route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  // Admin-status RPCs mirror the scenario.
  await page.route(/\/rest\/v1\/rpc\/is_current_user_admin/, (route: Route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(opts.admin) });
  });
  await page.route(/\/rest\/v1\/rpc\/(get_quota_status|get_all_quota_status)/, (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        opts.admin ? { used: 0, limit: -1, admin: true } : { used: 3, limit: 3, admin: false },
      ),
    });
  });
  await page.route(/\/rest\/v1\/rpc\/can_retake_quiz/, (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        opts.admin
          ? { allowed: true, admin: true }
          : { allowed: false, reason: "quiz_already_completed" },
      ),
    });
  });

  await page.addInitScript(({ onboarding, admin }) => {
    window.localStorage.setItem("xplania:onboarding", JSON.stringify(onboarding));
    // Test-only marker read by admin-access.ts. Real security is server-side,
    // so this front-only flag cannot grant access to a real Supabase query.
    if (admin) {
      window.localStorage.setItem("xplania:e2e_force_admin", "1");
    }
  }, { onboarding: LOCAL_ONBOARDING, admin: opts.admin });
}

test.describe("admin access — freemium paywall", () => {
  test("non-admin sees premium locks on locked feature cards", async ({ page }) => {
    await stubBackend(page, { admin: false });
    await page.goto("/profil-voyageur/resultat");

    // Locked features render as a <button aria-label="Débloquer <Feature> avec Premium">.
    const lockedButton = page.getByRole("button", { name: /Débloquer.*Premium/i }).first();
    await expect(lockedButton).toBeVisible();

    await lockedButton.click();

    // Paywall dialog opens with the pricing grid.
    await expect(
      page.getByRole("heading", { name: /Débloque tout Xplania|Passe Premium/i }),
    ).toBeVisible();

    // No admin badge for a normal visitor.
    await expect(page.getByLabel("Mode Admin")).toHaveCount(0);
  });

  test("admin sees no locks, no paywall, and the Mode Admin badge", async ({ page }) => {
    await stubBackend(page, { admin: true });
    await page.goto("/profil-voyageur/resultat");

    // Admin badge is rendered by AdminGate as soon as the flag is on.
    await expect(page.getByLabel("Mode Admin")).toBeVisible();

    // Every card is unlocked — no "Débloquer … Premium" button anywhere.
    await expect(page.getByRole("button", { name: /Débloquer.*Premium/i })).toHaveCount(0);

    // Paywall dialog is never mounted.
    await expect(page.getByRole("heading", { name: /Débloque tout Xplania/i })).toHaveCount(0);
  });
});
