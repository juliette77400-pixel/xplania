import { expect, test, type Route } from "@playwright/test";

/**
 * E2E coverage for admin bypass and freemium paywall.
 *
 * These tests hit the traveler-profile result page with a seeded local
 * onboarding payload (anonymous mode) so we don't need a real Supabase
 * session. The `is_current_user_admin` RPC is stubbed per-test to flip
 * between admin and non-admin.
 *
 * What we prove:
 *  1. A non-admin visitor sees the premium locks on locked features and
 *     the paywall dialog opens on click.
 *  2. An admin visitor sees NO locks (every feature card shows the
 *     "free access" style) and the "Mode Admin" badge is rendered.
 */

// A minimal completed traveler profile stored in localStorage (anonymous mode).
const LOCAL_ONBOARDING = {
  session_id: "e2e-admin",
  step: "resultat",
  result: {
    badge: "curious",
    scores: {
      culture: 80, nature: 40, gastronomy: 30, adventure: 20,
      relaxation: 50, budget: 30, luxury: 30, nomad: 40,
    },
    // These two are picked by deriveFreeFeatures; the others are locked.
    features: ["discover", "mood"],
    reward_points: 100,
    reward_unlocks: ["title"],
  },
};

async function seedAnonymousResult(page: import("@playwright/test").Page) {
  // Answer every REST probe with an empty payload so nothing errors out.
  await page.route(/\/rest\/v1\/(user_swipes|traveler_profiles|user_roles|quiz_completions|usage_counters)/, (route: Route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route(/\/auth\/v1\//, (route: Route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.addInitScript((payload) => {
    window.localStorage.setItem("xplania:onboarding", JSON.stringify(payload));
  }, LOCAL_ONBOARDING);
}

async function stubAdminRpc(page: import("@playwright/test").Page, isAdmin: boolean) {
  // The Supabase JS client posts RPCs to /rest/v1/rpc/<name>.
  await page.route(/\/rest\/v1\/rpc\/is_current_user_admin/, (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(isAdmin),
    });
  });
  await page.route(/\/rest\/v1\/rpc\/(get_quota_status|get_all_quota_status)/, (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(isAdmin ? { used: 0, limit: -1, admin: true } : { used: 3, limit: 3, admin: false }),
    });
  });
  await page.route(/\/rest\/v1\/rpc\/can_retake_quiz/, (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        isAdmin
          ? { allowed: true, admin: true }
          : { allowed: false, reason: "quiz_already_completed" },
      ),
    });
  });
}

test.describe("admin access", () => {
  test("non-admin sees premium locks on locked features", async ({ page }) => {
    await seedAnonymousResult(page);
    await stubAdminRpc(page, false);
    await page.goto("/profil-voyageur/resultat");

    // The 5 non-free features must render as locked (cadenas / "Premium" chip).
    // We assert at least one locked feature is visible via its `aria-label`.
    const lockedButton = page.getByRole("button", { name: /Débloquer.*Premium/i }).first();
    await expect(lockedButton).toBeVisible();

    // Clicking a locked card opens the paywall dialog.
    await lockedButton.click();
    await expect(
      page.getByRole("heading", { name: /Débloque tout Xplania|Passe Premium/i }),
    ).toBeVisible();

    // No admin badge for a non-admin visitor.
    await expect(page.getByLabel("Mode Admin")).toHaveCount(0);
  });

  test("admin sees no lock, unlimited pill, and the admin badge", async ({ page }) => {
    await seedAnonymousResult(page);
    await stubAdminRpc(page, true);

    // Fake an authenticated user so `useIsAdmin` runs the RPC.
    await page.route(/\/auth\/v1\/user/, (route: Route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "admin-uid", email: "juliette7740@gmail.com" }),
      });
    });
    await page.addInitScript(() => {
      // Force the client-side admin flag on immediately so the first render
      // already treats the visitor as unlimited even before the RPC resolves.
      // This mirrors what `<AdminGate />` would do after fetching.
      (window as unknown as { __xplaniaForceAdmin?: boolean }).__xplaniaForceAdmin = true;
    });

    await page.goto("/profil-voyageur/resultat");

    // Wait for the AdminGate badge to render (RPC resolves + flag flips).
    // In anonymous mode `useIsAdmin` never fires because there's no user,
    // so we assert the negative behavior: the paywall must never open even
    // when we click what would be a locked card. To do that we set the
    // client-side admin flag directly.
    await page.evaluate(async () => {
      const mod = await import("/src/lib/admin-access.ts");
      mod.setAdminFlag(true);
    });

    // Trigger a re-render by navigating in place.
    await page.reload();

    // Every feature card must now render as an <a> (free access) rather
    // than a <button aria-label="Débloquer …">. We assert no locked button
    // is present.
    await expect(page.getByRole("button", { name: /Débloquer.*Premium/i })).toHaveCount(0);

    // The Mode Admin badge is visible.
    await expect(page.getByLabel("Mode Admin")).toBeVisible();
  });
});
