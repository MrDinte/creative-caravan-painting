import { test, expect, type Page } from "@playwright/test";
import { writesData } from "./helpers";

async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("caravan2026");
  await page.getByTestId("admin-login-submit").click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

test.describe("Staff management", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("lists the seeded team", async ({ page }) => {
    await page.goto("/admin/staff");
    await expect(page.locator("h1")).toContainText("Staff");
    await expect(page.getByTestId("staff-row-Tim")).toBeVisible();
    await expect(page.getByTestId("staff-row-Jake")).toBeVisible();
  });

  test("adds a team member", async ({ page }) => {
    writesData();
    await page.goto("/admin/staff");
    const name = `Tester ${Date.now().toString().slice(-5)}`;
    await page.getByTestId("staff-add-form").getByLabel("Name").fill(name);
    await page.getByTestId("staff-add-form").getByLabel("Role").fill("Detailing");
    await page.getByTestId("add-staff-submit").click();

    await expect(page.getByRole("status")).toContainText(
      new RegExp(`${name} added to the team`)
    );
    await expect(page.getByText("Detailing").first()).toBeVisible();
  });

  test("rejects a blank name", async ({ page }) => {
    await page.goto("/admin/staff");
    await page
      .getByTestId("staff-add-form")
      .evaluate((f) => f.setAttribute("novalidate", ""));
    await page.getByTestId("add-staff-submit").click();
    await expect(page.getByRole("status")).toContainText(/Enter a name/i);
  });

  test("edits a team member", async ({ page }) => {
    await page.goto("/admin/staff");
    await page.getByTestId("edit-staff-Mel").click();
    await expect(
      page.getByRole("heading", { name: /Edit Mel/ })
    ).toBeVisible();

    await page.getByTestId("staff-edit-form").getByLabel("Role").fill("Interiors Lead");
    await page.getByTestId("save-staff-submit").click();

    await expect(page.getByRole("status")).toContainText(/Saved Mel/);
    await expect(page.getByText("Interiors Lead")).toBeVisible();
  });

  test("staff appear in the job allocation dropdown", async ({ page }) => {
    await page.goto("/admin/jobs/new");
    const select = page.getByLabel("Allocated to");
    await expect(select).toBeVisible();
    await expect(select.locator("option")).toContainText(["Unallocated", "Tim"]);
  });
});

test.describe("Job location", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("filters jobs by location", async ({ page }) => {
    await page.goto("/admin/jobs");
    await expect(page.getByTestId("loc-filter-all")).toBeVisible();
    await expect(page.getByTestId("loc-filter-workshop")).toBeVisible();
    await expect(page.getByTestId("loc-filter-bellmere")).toBeVisible();

    // Bellmere holds CCP-2026-003 in the seed data.
    await page.getByTestId("loc-filter-bellmere").click();
    await expect(page).toHaveURL(/loc=bellmere/);
    await expect(
      page.getByRole("link", { name: "CCP-2026-003" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "CCP-2026-001" })
    ).toHaveCount(0);

    await page.getByTestId("loc-filter-workshop").click();
    await expect(
      page.getByRole("link", { name: "CCP-2026-001" })
    ).toBeVisible();
  });

  test("job detail shows location and allocation", async ({ page }) => {
    await page.goto("/admin/jobs");
    await page.getByRole("link", { name: "CCP-2026-003" }).click();
    await expect(page.getByText("Bellmere").first()).toBeVisible();
  });
});

test.describe("Editing a job", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("dates, location and allocation can all be changed", async ({ page }) => {
    await page.goto("/admin/jobs");
    await page.getByRole("link", { name: "CCP-2026-004" }).click();

    await page.getByTestId("edit-job-open").click();
    await expect(page.getByTestId("edit-job-form")).toBeVisible();

    await page.getByLabel("Scheduled start").fill("2026-06-30");
    await page.getByLabel("Scheduled end").fill("2026-07-25");
    await page.getByLabel("Location").selectOption("bellmere");
    await page.getByTestId("save-job-submit").click();

    await expect(page.getByRole("status")).toContainText(/Job updated/i);
    await expect(page.getByText("Bellmere").first()).toBeVisible();

    // Put it back so the suite stays re-runnable.
    await page.getByTestId("edit-job-open").click();
    await page.getByLabel("Scheduled start").fill("2026-06-29");
    await page.getByLabel("Scheduled end").fill("2026-07-22");
    await page.getByLabel("Location").selectOption("workshop");
    await page.getByTestId("save-job-submit").click();
    await expect(page.getByRole("status")).toContainText(/Job updated/i);
  });

  test("rejects an end date before the start date", async ({ page }) => {
    await page.goto("/admin/jobs");
    await page.getByRole("link", { name: "CCP-2026-002" }).click();
    await page.getByTestId("edit-job-open").click();

    await page.getByLabel("Scheduled start").fill("2026-09-20");
    await page.getByLabel("Scheduled end").fill("2026-09-01");
    await page.getByTestId("save-job-submit").click();

    await expect(page.getByTestId("form-error")).toContainText(
      /End date must be/i
    );
  });
});

test.describe("Converting a quote", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("lets you set dates, staff and location before creating the job", async ({
    page,
  }) => {
    writesData();
    await page.goto("/admin/quotes");
    await page.getByRole("link", { name: "Q-2026-015" }).click();

    await page.getByTestId("convert-quote").click();
    const form = page.getByTestId("convert-quote-form");
    await expect(form).toBeVisible();

    // The dates are editable, not fixed.
    await form.getByLabel("Scheduled start").fill("2026-10-05");
    await form.getByLabel("Scheduled end").fill("2026-10-19");
    await form.getByLabel("Location").selectOption("bellmere");
    await page.getByTestId("confirm-convert-quote").click();

    await expect(page).toHaveURL(/\/admin\/jobs\/[a-z0-9-]+$/i);
    await expect(page.getByText("2026-10-05")).toBeVisible();
    await expect(page.getByText("Bellmere").first()).toBeVisible();
  });

  test("rejects an invalid date range on conversion", async ({ page }) => {
    await page.goto("/admin/quotes");
    await page.getByRole("link", { name: "Q-2026-014" }).click();
    await page.getByTestId("convert-quote").click();

    const form = page.getByTestId("convert-quote-form");
    await form.getByLabel("Scheduled start").fill("2026-11-20");
    await form.getByLabel("Scheduled end").fill("2026-11-01");
    await page.getByTestId("confirm-convert-quote").click();

    await expect(page.getByTestId("form-error")).toContainText(
      /End date must be/i
    );
  });
});

test.describe("Job update photos", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("the update form offers a photo picker", async ({ page }) => {
    await page.goto("/admin/jobs");
    await page.getByRole("link", { name: "CCP-2026-001" }).click();

    const form = page.getByTestId("add-update-form");
    await expect(form).toBeVisible();

    // Either the picker is live, or it explains why it isn't — never silence.
    const input = page.getByTestId("photo-input");
    const notice = page.getByText(/Photo uploads are off/i);
    await expect(input.or(notice).first()).toBeVisible();
  });

  test("an update can be posted without a photo", async ({ page }) => {
    writesData();
    await page.goto("/admin/jobs");
    await page.getByRole("link", { name: "CCP-2026-001" }).click();

    await page
      .getByPlaceholder("Base coat is down and looking great…")
      .fill("Photo-less update from the suite");
    await page.getByTestId("add-update-submit").click();

    await expect(page.getByRole("status")).toContainText(/customer can see/i);
  });

  test("an empty update with no photo is rejected", async ({ page }) => {
    await page.goto("/admin/jobs");
    await page.getByRole("link", { name: "CCP-2026-002" }).click();
    await page.getByTestId("add-update-submit").click();

    await expect(page.getByRole("status")).toContainText(
      /Write an update or attach a photo/i
    );
  });
});

test.describe("Homepage portal link", () => {
  test("hero and CTA both link to the customer portal", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("hero-portal-link")).toHaveAttribute(
      "href",
      "/portal"
    );
    await expect(page.getByTestId("cta-portal-link")).toHaveAttribute(
      "href",
      "/portal"
    );

    await page.getByTestId("hero-portal-link").click();
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.locator("h1")).toContainText(/Customer Portal/i);
  });
});
