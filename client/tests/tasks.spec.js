
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {

  // Capture browser errors
  page.on("console", (msg) => {
  console.log("BROWSER:", msg.text());
  console.log("ERROR LOCATION:", msg.location().url);
});

page.on("requestfailed", (request) => {
  console.log("FAILED REQUEST:", request.url());
  console.log("FAILURE REASON:", request.failure()?.errorText);
});

  page.on("pageerror", (error) => {
    console.log("PAGE ERROR:", error.message);
  });
  page.on("response", async (response) => {
  const url = response.url();
  const contentType = response.headers()["content-type"] || "";

  if (
    (url.includes(".js") || url.includes(".jsx")) &&
    contentType.includes("application/json")
  ) {
    console.log("BROKEN MODULE URL:", url);
    console.log("STATUS:", response.status());
    console.log("RESPONSE:", await response.text());
  }
});
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

  // Mock API GET requests
  await page.route("http://localhost:5000/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() !== "GET") {
      return route.fallback();
    }

    // Tasks
    if (url.pathname === "/api/tasks") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              title: "Build Login API",
              status: "IN_PROGRESS",
              priority: "HIGH",
              dueDate: "2026-12-20T00:00:00.000Z",
              project: {
                id: 1,
                name: "WorkSphere"
              },
              assignedTo: {
                id: 2,
                name: "Test Developer"
              }
            },
            {
              id: 2,
              title: "Fix Dashboard UI",
              status: "COMPLETED",
              priority: "MEDIUM",
              dueDate: null,
              project: {
                id: 1,
                name: "WorkSphere"
              },
              assignedTo: null
            }
          ]
        })
      });
    }

    // Projects
    if (url.pathname === "/api/projects") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              name: "WorkSphere"
            }
          ]
        })
      });
    }

    // Project members
    if (url.pathname === "/api/projects/members") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 2,
              name: "Test Developer",
              role: "DEVELOPER"
            }
          ]
        })
      });
    }

    // Notifications and other app-shell GET requests
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        count: 0,
        unreadCount: 0,
        data: []
      })
    });
  });
});


// TEST 1: Display tasks
test("Tasks page should display tasks", async ({ page }) => {
  await page.goto("/tasks");

  await expect(
    page.getByRole("heading", { name: "Tasks" })
  ).toBeVisible();

  await expect(
    page.getByText("Build Login API")
  ).toBeVisible();

  await expect(
    page.getByText("Fix Dashboard UI")
  ).toBeVisible();
});


// TEST 2: Search tasks
test("Task search should filter tasks", async ({ page }) => {
  await page.goto("/tasks");

  await page
    .getByPlaceholder("Search tasks...")
    .fill("Build Login API");

  await expect(
    page.getByText("Build Login API")
  ).toBeVisible();

  await expect(
    page.getByText("Fix Dashboard UI")
  ).toBeHidden();
});


// TEST 3: Filter completed tasks
test("Task status filter should show completed tasks", async ({ page }) => {
  await page.goto("/tasks");

  const statusFilter = page.locator("select").filter({
    has: page.locator('option[value="Completed"]')
  });

  await statusFilter.selectOption("Completed");

  await expect(
    page.getByText("Fix Dashboard UI")
  ).toBeVisible();

  await expect(
    page.getByText("Build Login API")
  ).toBeHidden();
});


// TEST 4: Add Task form
test("Add Task form should display required fields", async ({ page }) => {
  await page.goto("/tasks");

  await page.getByRole("button", {
    name: "Add Task"
  }).click();

  await expect(
    page.getByRole("heading", { name: "Create New Task" })
  ).toBeVisible();

  await expect(
    page.getByPlaceholder("Task Name")
  ).toBeVisible();

  await expect(
    page.getByPlaceholder("Task Description")
  ).toBeVisible();

  await expect(
    page.locator('select[name="projectId"]')
  ).toBeVisible();

  await expect(
    page.locator('select[name="assignedToId"]')
  ).toBeVisible();

  await expect(
    page.locator('select[name="priority"]')
  ).toBeVisible();
});


// TEST 5: Create and assign task
test("Task creation should send correct assignment data", async ({ page }) => {

  let createdTask = null;

  // Mock task creation
  await page.route("**/api/tasks", async (route) => {

    if (route.request().method() === "POST") {
      createdTask = route.request().postDataJSON();

      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: 3,
            ...createdTask
          }
        })
      });
    }

    return route.fallback();
  });

  await page.goto("/tasks");

  await page.getByRole("button", {
    name: "Add Task"
  }).click();

  await page
    .getByPlaceholder("Task Name")
    .fill("Test Assignment");

  await page
    .getByPlaceholder("Task Description")
    .fill("Testing task assignment");

  await page
    .locator('select[name="projectId"]')
    .selectOption("1");

  await page
    .locator('select[name="assignedToId"]')
    .selectOption("2");

  await page
    .locator('select[name="priority"]')
    .selectOption("HIGH");

  await page.getByRole("button", {
    name: "Save Task"
  }).click();

  await expect.poll(() => createdTask).not.toBeNull();

  expect(createdTask.title).toBe("Test Assignment");
  expect(createdTask.projectId).toBe(1);
  expect(createdTask.assignedToId).toBe(2);
  expect(createdTask.priority).toBe("HIGH");
});
