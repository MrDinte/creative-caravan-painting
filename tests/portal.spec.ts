import { test, expect } from "@playwright/test";

test.describe("Customer portal security", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/portal/job");
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.locator("h1")).toContainText(/Customer Portal/i);
  });

  test("rejects wrong credentials", async ({ page }) => {
    await page.goto("/portal");
    await page.getByLabel("Job code").fill("CCP-2026-001");
    await page.getByLabel("Access code").fill("WRONG");
    await page.getByTestId("portal-login-submit").click();

    await expect(page.getByTestId("portal-login-error")).toContainText(
      /couldn't match/i
    );
    await expect(page).toHaveURL(/\/portal$/);
  });

  test("rejects a valid access code against the wrong job", async ({ page }) => {
    await page.goto("/portal");
    await page.getByLabel("Job code").fill("CCP-2026-002");
    await page.getByLabel("Access code").fill("VAN123"); // belongs to -001
    await page.getByTestId("portal-login-submit").click();

    await expect(page.getByTestId("portal-login-error")).toBeVisible();
  });
});

test.describe("Customer portal — logged in", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal");
    await page.getByLabel("Job code").fill("CCP-2026-001");
    await page.getByLabel("Access code").fill("VAN123");
    await page.getByTestId("portal-login-submit").click();
    await expect(page).toHaveURL(/\/portal\/job$/);
  });

  test("shows the job, status tracker and progress", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(
      /Full Exterior Respray/i
    );
    await expect(page.getByText("CCP-2026-001").first()).toBeVisible();
    await expect(page.getByText("In Progress").first()).toBeVisible();

    // The page now carries two: job completion and payment progress.
    const progressbar = page.getByRole("progressbar", { name: "Job completion" });
    await expect(progressbar).toBeVisible();
    await expect(page.getByTestId("portal-progress")).toContainText(/of 5 tasks/);
  });

  test("shows only customer-visible updates", async ({ page }) => {
    const updates = page.getByTestId("portal-updates");
    await expect(updates).toContainText(/Base coat down/i);
    // Internal note must never leak to the customer.
    await expect(updates).not.toContainText(/Internal note/i);
  });

  test("lists the work checklist with work IDs", async ({ page }) => {
    await expect(page.getByText("CCP-2026-001-W01").first()).toBeVisible();
    await expect(page.getByText(/Sand and prep exterior panels/i)).toBeVisible();
  });

  test("log out ends the session", async ({ page }) => {
    await page.getByTestId("portal-logout").click();
    await expect(page).toHaveURL(/\/portal$/);

    await page.goto("/portal/job");
    await expect(page).toHaveURL(/\/portal$/);
  });
});
