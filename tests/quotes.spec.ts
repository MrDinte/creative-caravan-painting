import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("caravan2026");
  await page.getByTestId("admin-login-submit").click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

/**
 * Adds a price book line by its code. Option values are database IDs, so we
 * resolve the value from the visible option text first.
 */
async function addPriceBookLine(page: Page, code: string) {
  const picker = page.getByTestId("price-book-picker");
  const value = await picker
    .locator("option")
    .filter({ hasText: code })
    .first()
    .getAttribute("value");
  expect(value, `price book option ${code} should exist`).toBeTruthy();
  await picker.selectOption(value!);
}

test.describe("Master price book", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("lists rates grouped by category", async ({ page }) => {
    await page.goto("/admin/prices");
    await expect(page.getByText("PB-EXT-01").first()).toBeVisible();
    await expect(page.getByText("$6,500.00").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Exterior Painting" })
    ).toBeVisible();
  });

  test("adds a new rate", async ({ page }) => {
    await page.goto("/admin/prices");
    await page.getByLabel("Code").fill("PB-TEST-99");
    await page.getByLabel("Description").fill("Playwright test rate");
    await page.getByLabel("Category").fill("Testing");
    await page.getByLabel("Unit").fill("each");
    await page.getByLabel(/Price \(AUD\)/).fill("249.50");
    await page.getByTestId("save-price-submit").click();

    await expect(page.getByRole("status")).toContainText(/Saved PB-TEST-99/);
    await expect(page.getByText("$249.50").first()).toBeVisible();
  });

  test("edits an existing rate", async ({ page }) => {
    await page.goto("/admin/prices");
    await page.getByTestId("edit-price-PB-LAB-01").click();

    await expect(
      page.getByRole("heading", { name: "Edit rate" })
    ).toBeVisible();
    await page.getByLabel(/Price \(AUD\)/).fill("125.00");
    await page.getByTestId("save-price-submit").click();

    await expect(page.getByRole("status")).toContainText(/Saved PB-LAB-01/);
    await expect(page.getByText("$125.00").first()).toBeVisible();
  });

  // Regression: `code` is unique, so re-adding an existing one used to raise a
  // database constraint violation and render a 500 instead of saving.
  // PB-WIN-03 rather than PB-LAB-01: the "edits an existing rate" test above
  // mutates PB-LAB-01, and these run in parallel.
  test("re-adding an existing code updates it instead of erroring", async ({
    page,
  }) => {
    await page.goto("/admin/prices");
    await page.getByLabel("Code").fill("PB-WIN-03");
    await page.getByLabel("Description").fill("Perspex supply & cut — curved");
    await page.getByLabel("Category").fill("Windows");
    await page.getByLabel("Unit").fill("per window");
    await page.getByLabel(/Price \(AUD\)/).fill("380.00");
    await page.getByTestId("save-price-submit").click();

    // The page must survive: previously this raised a unique violation on
    // price_book.code and rendered a server-error screen.
    await expect(page.getByRole("status")).toContainText(/Saved PB-WIN-03/);
    await expect(page.locator("h1")).toContainText(/Master Price Book/i);

    // Exactly one row for that code — updated, not duplicated. Scoped to the
    // list entry so it can't also match the "Saved …" confirmation text.
    await expect(page.getByText("PB-WIN-03 · per window")).toHaveCount(1);
  });

  test("validates a missing code", async ({ page }) => {
    await page.goto("/admin/prices");
    await page
      .getByTestId("price-book-form")
      .evaluate((f) => f.setAttribute("novalidate", ""));
    await page.getByLabel("Description").fill("No code supplied");
    await page.getByTestId("save-price-submit").click();

    await expect(page.getByRole("status")).toContainText(/required/i);
  });
});

test.describe("Quote builder", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("pulls prices from the price book and totals with GST", async ({
    page,
  }) => {
    await page.goto("/admin/quotes/new");
    await page.getByLabel("Customer name").fill("Quote Test Customer");

    // Add the $6,500 exterior respray from the price book.
    await addPriceBookLine(page, "PB-EXT-01");

    await expect(page.getByTestId("quote-line")).toHaveCount(1);
    await expect(page.getByTestId("line-unit-price")).toHaveValue("6500.00");
    // 6500 + 10% GST = 7150
    await expect(page.getByTestId("quote-total")).toContainText("$7,150.00");
  });

  test("allows editing a price without changing the master rate", async ({
    page,
  }) => {
    await page.goto("/admin/quotes/new");
    await page.getByLabel("Customer name").fill("Override Test");
    await addPriceBookLine(page, "PB-EXT-01");

    // Override 6500 → 6000 for this quote only.
    await page.getByTestId("line-unit-price").fill("6000.00");
    await expect(page.getByText(/Price overridden/i)).toBeVisible();
    await expect(page.getByTestId("quote-total")).toContainText("$6,600.00");

    // The master price book is untouched.
    await page.goto("/admin/prices");
    await expect(page.getByText("$6,500.00").first()).toBeVisible();
  });

  test("supports custom lines outside the price book", async ({ page }) => {
    await page.goto("/admin/quotes/new");
    await page.getByLabel("Customer name").fill("Custom Line Test");
    await page.getByTestId("add-custom-line").click();

    await expect(page.getByTestId("quote-line")).toHaveCount(1);
    await page.getByLabel("Line description").fill("Bespoke fabrication work");
    await page.getByLabel("Unit price").fill("1500.00");
    await expect(page.getByTestId("quote-total")).toContainText("$1,650.00");
  });

  test("quantity changes recalculate the total", async ({ page }) => {
    await page.goto("/admin/quotes/new");
    await page.getByLabel("Customer name").fill("Qty Test");
    await addPriceBookLine(page, "PB-WIN-01"); // $125.00

    await page.getByLabel("Quantity").fill("4");
    // 4 × 125 = 500, +GST = 550
    await expect(page.getByTestId("quote-total")).toContainText("$550.00");
  });

  test("removes a line", async ({ page }) => {
    await page.goto("/admin/quotes/new");
    await page.getByLabel("Customer name").fill("Remove Test");
    await page.getByTestId("add-custom-line").click();
    await expect(page.getByTestId("quote-line")).toHaveCount(1);

    await page.getByRole("button", { name: /Remove line/i }).click();
    await expect(page.getByTestId("quote-line")).toHaveCount(0);
  });

  test("save is disabled until a line exists", async ({ page }) => {
    await page.goto("/admin/quotes/new");
    await expect(page.getByTestId("save-quote-submit")).toBeDisabled();

    await page.getByTestId("add-custom-line").click();
    await expect(page.getByTestId("save-quote-submit")).toBeEnabled();
  });

  test("saves a quote and opens its detail page", async ({ page }) => {
    await page.goto("/admin/quotes/new");
    await page.getByLabel("Customer name").fill("Full Quote Flow");
    await page.getByLabel("Email").fill("flow@example.com");
    await page.getByLabel(/Van make/).fill("Test Van 1985");
    await addPriceBookLine(page, "PB-SEAL-01");
    await page.getByTestId("save-quote-submit").click();

    await expect(page).toHaveURL(/\/admin\/quotes\/[a-z0-9-]+$/i);
    await expect(page.locator("h1")).toContainText("Full Quote Flow");
    await expect(page.getByText(/Q-\d{4}-\d{3}/).first()).toBeVisible();
    await expect(page.getByText("Roof reseal — Globalcote")).toBeVisible();
  });
});

test.describe("Quote lifecycle", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("existing quotes show totals in the list", async ({ page }) => {
    await page.goto("/admin/quotes");
    await expect(page.getByRole("link", { name: "Q-2026-014" })).toBeVisible();
    // 6500 + 1000 + (4 × 95) = 7880 → +GST = 8668
    await expect(page.getByText("$8,668.00")).toBeVisible();
  });

  test("flags a line whose price differs from the book rate", async ({
    page,
  }) => {
    await page.goto("/admin/quotes");
    await page.getByRole("link", { name: "Q-2026-014" }).click();
    await expect(page.getByText(/Custom price \(book rate/)).toBeVisible();
  });

  test("changes quote status", async ({ page }) => {
    await page.goto("/admin/quotes");
    await page.getByRole("link", { name: "Q-2026-015" }).click();

    await page.getByTestId("set-quote-status-sent").click();
    await expect(page.getByText("Sent").first()).toBeVisible();

    await page.getByTestId("set-quote-status-declined").click();
    await expect(page.getByText("Declined").first()).toBeVisible();
  });

  // Conversion now opens a form so dates, staff and location can be set up
  // front rather than defaulted and corrected afterwards.
  test("converts an accepted quote into a job", async ({ page }) => {
    await page.goto("/admin/quotes");
    await page.getByRole("link", { name: "Q-2026-014" }).click();
    await page.getByTestId("convert-quote").click();
    await page.getByTestId("confirm-convert-quote").click();

    await expect(page).toHaveURL(/\/admin\/jobs\/[a-z0-9-]+$/i);
    await expect(page.getByText(/CCP-\d{4}-\d{3}/).first()).toBeVisible();
    await expect(page.getByText("Peter Hall").first()).toBeVisible();
  });
});
