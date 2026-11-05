
import { test, expect } from "@playwright/test";

test("Registration page should display all required fields", async ({ page }) => {
  await page.goto("/register");

  await expect(
    page.getByRole("heading", { name: "Create your account" })
  ).toBeVisible();

  await expect(page.getByPlaceholder("Full Name")).toBeVisible();

  await expect(page.getByPlaceholder("Email Address")).toBeVisible();

  await expect(
    page.getByPlaceholder("Password (minimum 8 characters)")
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Create Account" })
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Login" })
  ).toBeVisible();
});

test("Registration should reject password shorter than 8 characters", async ({ page }) => {
  await page.route("**/api/auth/register", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: "Password must be at least 8 characters"
      })
    });
  });

  await page.goto("/register");

  await page.getByPlaceholder("Full Name").fill("Test User");

  await page.getByPlaceholder("Email Address").fill("test@example.com");

  await page
    .getByPlaceholder("Password (minimum 8 characters)")
    .fill("abc");

  await page.getByRole("button", { name: "Create Account" }).click();

  // Browser's native validation should block submission
  await expect(page.locator('input[name="password"]')).toHaveJSProperty(
    "validity.valid",
    false
  );
});
