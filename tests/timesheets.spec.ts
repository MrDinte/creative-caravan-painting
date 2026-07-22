import { test, expect, type Page } from "@playwright/test";
import { seededFixtures, writesData } from "./helpers";

async function loginAs(
  page: Page,
  username: string,
  password: string,
  { expectSuccess = true } = {}
) {
  await page.goto("/admin");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByTestId("admin-login-submit").click();
  // Wait for the session cookie to land before navigating anywhere else.
  if (expectSuccess) await page.waitForURL(/\/admin\/dashboard$/);
}

const ADMIN_ONLY = [
  "/admin/staff",
  "/admin/prices",
  "/admin/quotes",
  "/admin/enquiries",
];

test.describe("Per-staff logins", () => {
  test("a staff member can sign in with their own credentials", async ({
    page,
  }) => {
    seededFixtures();
    await loginAs(page, "jake", "workshop2026");
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    await expect(page.getByText(/Signed in as/)).toContainText("Jake");
  });

  test("the owner account still works", async ({ page }) => {
    await loginAs(page, "admin", "caravan2026");
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
  });

  test("a wrong password is rejected", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "jake", "not-the-password", { expectSuccess: false });
    await expect(page.getByTestId("admin-login-error")).toContainText(
      /Incorrect/i
    );
  });

  test("staff cannot reach admin-only sections by URL", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "jake", "workshop2026");
    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    for (const path of ADMIN_ONLY) {
      await page.goto(path);
      await expect(page, `${path} should be blocked`).toHaveURL(
        /\/admin\/dashboard$/
      );
    }
  });

  test("an admin can reach admin-only sections", async ({ page }) => {
    await loginAs(page, "admin", "caravan2026");
    for (const path of ADMIN_ONLY) {
      await page.goto(path);
      await expect(page, `${path} should open`).toHaveURL(
        new RegExp(`${path}$`)
      );
    }
  });

  test("staff navigation hides admin-only links", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "jake", "workshop2026");
    const nav = page.getByRole("navigation", { name: "Admin" });

    await expect(nav.getByRole("link", { name: /Timesheets/ })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Jobs/ })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Staff/ })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: /Price Book/ })).toHaveCount(0);
  });
});

test.describe("Timesheets and payroll", () => {
  test("admin sees weekly totals with overtime applied", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "admin", "caravan2026");
    await page.goto("/admin/timesheets");

    await expect(page.locator("h1")).toContainText("Timesheets");

    // Jake's seeded week: 8.5+8.5+9+9+9.5 = 44.5 h on site, less 5 × 30 min
    // unpaid break = 42 h paid. Past his 38 h threshold, so 4 h at ×2.5.
    // Ordinary 38 × $42 = $1,596. Overtime 4 × $42 × 2.5 = $420. Total $2,016.
    const jakeWeek = page
      .locator("div")
      .filter({ hasText: /Week beginning 2026-07-13/ })
      .first();
    await expect(jakeWeek).toBeVisible();
    await expect(page.getByText("$2,016.00").first()).toBeVisible();
    await expect(page.getByText(/Over 38 h — overtime applied/).first()).toBeVisible();
  });

  test("a staff member sees only their own hours", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "mel", "workshop2026");
    await page.goto("/admin/timesheets");

    await expect(page.getByText(/Cushion reupholstery/)).toBeVisible();
    // Jake's and Tim's entries must not be visible to Mel.
    await expect(page.getByText(/Sanding and prep/)).toHaveCount(0);
    await expect(page.getByText(/Base coat/)).toHaveCount(0);
  });

  test("staff form does not offer a person picker", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "mel", "workshop2026");
    await page.goto("/admin/timesheets");
    await expect(page.getByTestId("timesheet-form")).toBeVisible();
    await expect(page.getByLabel("Who")).toHaveCount(0);
  });

  test("admin form does offer a person picker", async ({ page }) => {
    await loginAs(page, "admin", "caravan2026");
    await page.goto("/admin/timesheets");
    await expect(page.getByLabel("Who")).toBeVisible();
  });

  test("rejects a break longer than the hours worked", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "mel", "workshop2026");
    await page.goto("/admin/timesheets");

    await page.getByLabel("Hours on site").fill("0.5");
    await page.getByLabel("Unpaid break").fill("60");
    await page.getByTestId("add-timesheet-submit").click();

    await expect(page.getByRole("status")).toContainText(
      /break can't be longer/i
    );
  });

  test("rejects hours outside 0–24", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "mel", "workshop2026");
    await page.goto("/admin/timesheets");

    await page
      .getByTestId("timesheet-form")
      .evaluate((f) => f.setAttribute("novalidate", ""));
    await page.getByLabel("Hours on site").fill("30");
    await page.getByTestId("add-timesheet-submit").click();

    await expect(page.getByRole("status")).toContainText(/between 0 and 24/i);
  });

  test("logs hours and they appear in the list", async ({ page }) => {
    seededFixtures();
    writesData();
    await loginAs(page, "mel", "workshop2026");
    await page.goto("/admin/timesheets");

    await page.getByLabel("Date worked").fill("2026-07-20");
    await page.getByLabel("Hours on site").fill("7.5");
    await page.getByLabel("Unpaid break").fill("30");
    const note = `Suite entry ${Math.random().toString(36).slice(2, 8)}`;
    await page.getByLabel("Notes").fill(note);
    await page.getByTestId("add-timesheet-submit").click();

    await expect(page.getByRole("status")).toContainText(/Logged 7.5 h/);
    await expect(page.getByText(note).first()).toBeVisible();
  });
});

test.describe("Staff pay settings", () => {
  test("admin can see pay rates on the staff page", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "admin", "caravan2026");
    await page.goto("/admin/staff");

    await expect(page.getByTestId("staff-row-Jake")).toContainText("$42.00/h");
    await expect(page.getByTestId("staff-row-Jake")).toContainText("OT ×2.5");
  });

  test("login and pay forms appear when editing someone", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "admin", "caravan2026");
    await page.goto("/admin/staff");
    await page.getByTestId("edit-staff-Mel").click();

    await expect(page.getByTestId("staff-login-form")).toBeVisible();
    await expect(page.getByTestId("staff-pay-form")).toBeVisible();
  });

  test("rejects a short password", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "admin", "caravan2026");
    await page.goto("/admin/staff");
    await page.getByTestId("edit-staff-Mel").click();

    await page.getByTestId("staff-login-form").getByLabel("Password").fill("short");
    await page.getByTestId("save-login-submit").click();

    await expect(page.getByRole("status")).toContainText(/at least 8 characters/i);
  });

  test("rejects a username already in use", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "admin", "caravan2026");
    await page.goto("/admin/staff");
    await page.getByTestId("edit-staff-Mel").click();

    await page.getByTestId("staff-login-form").getByLabel("Username").fill("jake");
    await page.getByTestId("save-login-submit").click();

    await expect(page.getByRole("status")).toContainText(/already taken/i);
  });
});
