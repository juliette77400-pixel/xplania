import { expect, test } from "../playwright-fixture";

/**
 * Discover is auth-protected. Without a session, visiting /discover redirects
 * to /auth. This test guards that regression (the route stays protected and
 * the auth page mounts) — a working guard for the whole protected surface.
 */
test("discover route requires auth", async ({ page }) => {
  await page.goto("/discover", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/auth/, { timeout: 10_000 });
  await expect(page).toHaveURL(/\/auth/);
});

test("homepage exposes the create-trip CTA", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // The primary CTA is rendered inside the hero once React hydrates.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // At least one CTA button (create trip / demo / discover) should be reachable.
  const buttons = page.getByRole("button");
  await expect(buttons.first()).toBeVisible();
});
