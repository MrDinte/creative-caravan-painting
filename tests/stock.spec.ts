import { test, expect, type Page } from "@playwright/test";
import { seededFixtures, writesData } from "./helpers";

async function loginAs(page: Page, username: string, password: string) {
  await page.goto("/admin");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByTestId("admin-login-submit").click();
  await page.waitForURL(/\/admin\/dashboard$/);
}

test.describe("Stock list", () => {
  test.beforeEach(async ({ page }) => loginAs(page, "admin", "caravan2026"));

  test("shows stock value at cost and at sale, and a reorder count", async ({
    page,
  }) => {
    seededFixtures();
    await page.goto("/admin/stock");

    await expect(page.locator("h1")).toContainText("Stock");
    await expect(page.getByText("Stock at cost")).toBeVisible();
    await expect(page.getByText("Stock at sale value")).toBeVisible();
    // Three seeded items sit at or below their reorder level: teal topcoat
    // (2 of 2), 4mm tinted perspex (1 of 2) and Globalcote sealant (1 of 2).
    await expect(page.getByTestId("low-stock-count")).toHaveText("3");
  });

  test("filters by category and by low stock", async ({ page }) => {
    seededFixtures();
    await page.goto("/admin/stock");

    await page.getByTestId("stock-filter-paint").click();
    await expect(page).toHaveURL(/cat=paint/);
    await expect(page.getByText("Etch primer 4L")).toBeVisible();
    await expect(page.getByText("Entry door — 1750×600 white")).toHaveCount(0);

    await page.getByTestId("stock-filter-low").click();
    await expect(page).toHaveURL(/low=1/);
    // 4mm tinted perspex is at its reorder level.
    await expect(page.getByText(/4mm tinted/)).toBeVisible();
  });

  test("margin is shown per item", async ({ page }) => {
    seededFixtures();
    await page.goto("/admin/stock");
    // Gloss white: cost $185, sale $275 → profit $90 → 33% of sale.
    const row = page.locator("tr").filter({ hasText: "Gloss White" });
    await expect(row).toContainText("33%");
  });
});

test.describe("Stock item", () => {
  test.beforeEach(async ({ page }) => loginAs(page, "admin", "caravan2026"));

  test("shows margin, markup and a printable CCP barcode", async ({ page }) => {
    seededFixtures();
    await page.goto("/admin/stock");
    await page.getByRole("link", { name: "CCP-S-0001" }).click();

    await expect(page.getByTestId("margin-percent")).toHaveText("33%");
    // Markup on cost is a different figure from margin on sale — both shown.
    await expect(page.getByText(/Markup on cost is 49%/)).toBeVisible();

    // The barcode is a real Code 128 rendering, not a picture of the text.
    const barcode = page.getByRole("img", { name: /Barcode for CCP-S-0001/ });
    await expect(barcode).toBeVisible();
    const bars = barcode.locator("rect");
    expect(await bars.count()).toBeGreaterThan(20);
  });

  test("booking stock out reduces the quantity", async ({ page }) => {
    seededFixtures();
    writesData();
    await page.goto("/admin/stock");
    await page.getByRole("link", { name: "CCP-S-0003" }).click();

    // Read the current quantity rather than assuming the seeded figure: both
    // browser projects share one server and this test books stock out.
    const before = Number(
      (await page.getByTestId("qty-on-hand").textContent())!.replace(
        /[^\d.]/g,
        ""
      )
    );
    expect(before).toBeGreaterThanOrEqual(2);

    await page.getByTestId("direction-out").click();
    await page.getByTestId("adjust-qty").fill("2");
    await page.getByTestId("adjust-stock-submit").click();

    await expect(page.getByRole("status")).toContainText(/Removed 2 tin/);
    await expect(page.getByRole("status")).toContainText(
      new RegExp(`${before - 2} now on hand`)
    );
  });

  test("refuses to book out more than is on hand", async ({ page }) => {
    seededFixtures();
    await page.goto("/admin/stock");
    await page.getByRole("link", { name: "CCP-S-0008" }).click();

    await page.getByTestId("direction-out").click();
    await page.getByTestId("adjust-qty").fill("99");
    await page.getByTestId("adjust-stock-submit").click();

    await expect(page.getByRole("status")).toContainText(/Only 2 each on hand/);
  });
});

test.describe("Barcode lookup", () => {
  test.beforeEach(async ({ page }) => loginAs(page, "admin", "caravan2026"));

  test("finds an item by its CCP code", async ({ page }) => {
    seededFixtures();
    await page.goto("/admin/stock");

    await page.getByTestId("barcode-input").fill("CCP-S-0006");
    await page.getByTestId("barcode-lookup-submit").click();

    await expect(page).toHaveURL(/\/admin\/stock\/[a-z0-9-]+$/i);
    await expect(page.locator("h1")).toContainText("Window winder assembly");
  });

  test("finds an item by the supplier barcode", async ({ page }) => {
    seededFixtures();
    await page.goto("/admin/stock");

    await page.getByTestId("barcode-input").fill("9315544220017");
    await page.getByTestId("barcode-lookup-submit").click();

    await expect(page.locator("h1")).toContainText(/3mm clear/);
  });

  test("explains when a code isn't known", async ({ page }) => {
    await page.goto("/admin/stock");
    await page.getByTestId("barcode-input").fill("0000000000000");
    await page.getByTestId("barcode-lookup-submit").click();

    await expect(page.getByTestId("form-error")).toContainText(/Nothing found/);
  });
});

test.describe("Adding stock", () => {
  test.beforeEach(async ({ page }) => loginAs(page, "admin", "caravan2026"));

  test("shows live margin as prices are typed", async ({ page }) => {
    await page.goto("/admin/stock/new");

    await page.getByLabel("Item name").fill("Test item");
    await page.getByLabel(/Cost price/).fill("50");
    await page.getByLabel(/Sale price/).fill("100");

    const margin = page.getByTestId("live-margin");
    await expect(margin).toContainText("$50.00 profit");
    await expect(margin).toContainText("50% margin");
  });

  test("warns when the sale price loses money", async ({ page }) => {
    await page.goto("/admin/stock/new");

    await page.getByLabel("Item name").fill("Loss maker");
    await page.getByLabel(/Cost price/).fill("100");
    await page.getByLabel(/Sale price/).fill("80");

    await expect(page.getByTestId("live-margin")).toContainText(
      /losing money/
    );
  });

  test("rejects a barcode already used by another item", async ({ page }) => {
    seededFixtures();
    await page.goto("/admin/stock/new");

    await page.getByLabel("Item name").fill(`Duplicate barcode ${Math.random().toString(36).slice(2, 8)}`);
    await page.getByTestId("stock-barcode-input").fill("9310872001234");
    await page.getByLabel(/Cost price/).fill("10");
    await page.getByLabel(/Sale price/).fill("20");
    await page.getByTestId("save-stock-submit").click();

    await expect(page.getByTestId("form-error")).toContainText(/already on/i);
  });

  test("creates an item with a generated CCP code", async ({ page }) => {
    writesData();
    await page.goto("/admin/stock/new");

    // Random, not time-based: both browser projects can run this same second.
    await page.getByLabel("Item name").fill(`Suite item ${Math.random().toString(36).slice(2, 8)}`);
    await page.getByLabel(/Cost price/).fill("12.50");
    await page.getByLabel(/Sale price/).fill("25");
    await page.getByTestId("save-stock-submit").click();

    await expect(page.getByTestId("stock-saved")).toContainText(/code CCP-S-\d{4}/);
  });
});

test.describe("Suppliers", () => {
  test.beforeEach(async ({ page }) => loginAs(page, "admin", "caravan2026"));

  test("lists suppliers with item counts and stock value", async ({ page }) => {
    seededFixtures();
    await page.goto("/admin/suppliers");

    await expect(page.getByTestId("supplier-Brisbane Paint Supplies")).toBeVisible();
    await expect(
      page.getByTestId("supplier-Brisbane Paint Supplies")
    ).toContainText("items");
  });

  test("shows items supplied and flags reorders", async ({ page }) => {
    seededFixtures();
    await page.goto("/admin/suppliers");
    await page.getByRole("link", { name: "Acrylic & Perspex Direct" }).click();

    await expect(page.locator("h1")).toContainText("Acrylic & Perspex Direct");
    await expect(page.getByText(/Items supplied \(2\)/)).toBeVisible();
    await expect(page.getByText(/to reorder/)).toBeVisible();
  });

  test("logbook records an entry", async ({ page }) => {
    seededFixtures();
    writesData();
    await page.goto("/admin/suppliers");
    await page.getByRole("link", { name: "Caravan Parts Wholesale" }).click();

    const note = `Called about winders ${Date.now() % 10000}`;
    await page.getByTestId("supplier-log-form").getByRole("textbox").fill(note);
    await page.getByTestId("add-log-submit").click();

    await expect(page.getByTestId("supplier-log")).toContainText(note);
  });
});

test.describe("Stock access control", () => {
  test("staff see stock but not cost, margin or suppliers", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "jake", "workshop2026");
    await page.goto("/admin/stock");

    // They can see what's on the shelf and book it out.
    await expect(page.getByText("Etch primer 4L")).toBeVisible();
    // But not the commercial columns.
    await expect(page.getByRole("columnheader", { name: "Cost" })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Margin" })).toHaveCount(0);

    await page.goto("/admin/suppliers");
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
  });
});
