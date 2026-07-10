import { expect, test } from "../playwright-fixture";

test("homepage renders", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveTitle(/Xplania/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
