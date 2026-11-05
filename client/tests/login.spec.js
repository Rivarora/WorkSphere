
import { test, expect } from "@playwright/test";

test("Login page should display all required elements", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: "WorkSphere" })
  ).toBeVisible();

  await expect(
    page.getByPlaceholder("Enter your email")
  ).toBeVisible();

  await expect(
    page.getByPlaceholder("Enter your password")
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Sign In" })
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Register" })
  ).toBeVisible();
});

test("Login should display an error for invalid credentials", async ({ page }) => {
  // Mock the backend response so this test is repeatable
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: "Invalid credentials"
      })
    });
  });

  await page.goto("/login");

  await page.getByPlaceholder("Enter your email")
    .fill("wrong@example.com");

  await page.getByPlaceholder("Enter your password")
    .fill("wrongpassword");

  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(
    page.getByText("Invalid credentials")
  ).toBeVisible();
});
