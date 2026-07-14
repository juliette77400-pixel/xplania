import { expect, test } from "../playwright-fixture";

test("dashboard route requires auth", async ({ page }) => {
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/auth/, { timeout: 10_000 });
  await expect(page).toHaveURL(/\/auth/);
});

test("carnets route requires auth", async ({ page }) => {
  await page.goto("/carnets", { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/auth/, { timeout: 10_000 });
  await expect(page).toHaveURL(/\/auth/);
});

test("legal page renders without auth", async ({ page }) => {
  await page.goto("/mentions-legales", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/mentions-legales/);
});
