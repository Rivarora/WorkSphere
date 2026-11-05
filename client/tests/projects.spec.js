
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Mock authentication
  await page.addInitScript(() => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: 1,
        name: "Test Admin",
        role: "ADMIN"
      })
    );
  });

  // Mock projects API
  await page.route("**/api/projects", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              name: "WorkSphere",
              description: "Team management platform",
              status: "IN_PROGRESS",
              deadline: "2026-12-30T00:00:00.000Z",
              members: [{ id: 2 }],
              tasks: [
                { id: 1, status: "COMPLETED" },
                { id: 2, status: "PENDING" }
              ]
            },
            {
              id: 2,
              name: "LinkPulse",
              description: "URL shortener",
              status: "PLANNING",
              deadline: null,
              members: [],
              tasks: []
            }
          ]
        })
      });
    } else {
      await route.continue();
    }
  });
});

test("Projects page should display projects", async ({ page }) => {
  await page.goto("/projects");

  await expect(
    page.getByRole("heading", { name: "Projects" })
  ).toBeVisible();

  await expect(
  page.locator("h3").filter({ hasText: "WorkSphere" })
).toBeVisible();

await expect(
  page.locator("h3").filter({ hasText: "LinkPulse" })
).toBeVisible();
});

test("Project search should filter projects", async ({ page }) => {
  await page.goto("/projects");

  await page.getByPlaceholder("Search projects...").fill("WorkSphere");

  await expect(
  page.locator("h3").filter({ hasText: "WorkSphere" })
).toBeVisible();

await expect(
  page.locator("h3").filter({ hasText: "LinkPulse" })
).toBeHidden();
});

test("Add Project form should open", async ({ page }) => {
  await page.goto("/projects");

  await page.getByRole("button", { name: "Add Project" }).click();

  await expect(
    page.getByRole("heading", { name: "Create New Project" })
  ).toBeVisible();

  await expect(page.getByPlaceholder("Project Name")).toBeVisible();
  await expect(page.getByPlaceholder("Project Description")).toBeVisible();
});

test("Project creation should send correct data", async ({ page }) => {
  let createdProject = null;

  await page.route("**/api/projects", async (route) => {
    if (route.request().method() === "POST") {
      createdProject = route.request().postDataJSON();

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { id: 3, ...createdProject }
        })
      });
    } else {
      await route.continue();
    }
  });

  await page.goto("/projects");

  await page.getByRole("button", { name: "Add Project" }).click();

  await page.getByPlaceholder("Project Name").fill("Test Project");
  await page.getByPlaceholder("Project Description").fill("Testing project creation");
  await page.locator('input[name="deadline"]').fill("2026-12-30");

  await page.getByRole("button", { name: "Save Project" }).click();

  await expect.poll(() => createdProject).not.toBeNull();

  expect(createdProject.name).toBe("Test Project");
  expect(createdProject.description).toBe("Testing project creation");
});
