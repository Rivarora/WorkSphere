
import { test, expect } from "@playwright/test";

test("WorkSphere homepage should load successfully", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/WorkSphere/i);

  await expect(page.locator("body")).toBeVisible();
});
