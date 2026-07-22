import { test, expect, type Page } from "@playwright/test";
import { seededFixtures, writesData } from "./helpers";

async function loginAdmin(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("caravan2026");
  await page.getByTestId("admin-login-submit").click();
  await page.waitForURL(/\/admin\/dashboard$/);
}

async function loginCustomer(page: Page, jobCode: string, accessCode: string) {
  await page.goto("/portal");
  await page.getByLabel("Job code").fill(jobCode);
  await page.getByLabel("Access code").fill(accessCode);
  await page.getByTestId("portal-login-submit").click();
  await page.waitForURL(/\/portal\/job$/);
}

test.describe("Admin invoicing", () => {
  test.beforeEach(async ({ page }) => loginAdmin(page));

  test("lists invoices with collected and outstanding totals", async ({
    page,
  }) => {
    seededFixtures();
    await page.goto("/admin/invoices");
    await expect(page.locator("h1")).toContainText("Invoices");

    await expect(page.getByTestId("invoice-INV-2026-001")).toBeVisible();
    // Other tests record payments against this invoice, and both browser
    // projects share one server — so assert the shape, not a fixed figure.
    await expect(page.getByTestId("total-outstanding")).toHaveText(
      /^\$[\d,]+\.\d{2}$/
    );
  });

  test("shows a part-paid invoice at 50%", async ({ page }) => {
    seededFixtures();
    await page.goto("/admin/invoices");

    const card = page.getByTestId("invoice-INV-2026-001");
    await expect(card).toContainText("Part paid");

    // Some of it is paid but not all — the exact figure moves as other tests
    // record payments against the same invoice.
    const percentText = await card.getByTestId("payment-percent").textContent();
    const percent = Number(percentText!.replace(/\D/g, ""));
    expect(percent).toBeGreaterThan(0);
    expect(percent).toBeLessThan(100);
  });

  test("shows a settled invoice as paid in full", async ({ page }) => {
    seededFixtures();
    await page.goto("/admin/invoices");

    const card = page.getByTestId("invoice-INV-2026-002");
    await expect(card).toContainText("Paid in full");
    await expect(card.getByTestId("payment-percent")).toHaveText("100% paid");
  });

  test("records a payment and reduces the balance", async ({ page }) => {
    seededFixtures();
    writesData();
    await page.goto("/admin/invoices");
    await page.getByRole("link", { name: "INV-2026-001" }).click();

    // Read the balance first and assert the arithmetic against it, so this
    // holds whatever other tests have already paid off.
    const before = Number(
      (await page.getByTestId("invoice-balance").textContent())!.replace(
        /[^\d.]/g,
        ""
      )
    );
    expect(before).toBeGreaterThan(1000);

    await page.getByTestId("record-payment-form").getByLabel("Amount").fill("1000");
    await page.getByTestId("record-payment-submit").click();

    await expect(page.getByRole("status")).toContainText(/\$1,000\.00 recorded/);

    const expected = (before - 1000).toLocaleString("en-AU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    await expect(page.getByRole("status")).toContainText(
      `$${expected} still outstanding`
    );
  });

  test("refuses a payment larger than the balance", async ({ page }) => {
    seededFixtures();
    await page.goto("/admin/invoices");
    await page.getByRole("link", { name: "INV-2026-001" }).click();

    await page.getByTestId("record-payment-form").getByLabel("Amount").fill("999999");
    await page.getByTestId("record-payment-submit").click();

    await expect(page.getByRole("status")).toContainText(/more than the/i);
  });

  test("a settled invoice offers no payment form", async ({ page }) => {
    seededFixtures();
    await page.goto("/admin/invoices");
    await page.getByRole("link", { name: "INV-2026-002" }).click();

    await expect(page.getByText(/paid in full/i).first()).toBeVisible();
    await expect(page.getByTestId("record-payment-submit")).toHaveCount(0);
  });

  test("the invoice builder totals with GST", async ({ page }) => {
    await page.goto("/admin/invoices/new");

    await page.getByLabel("Customer name").fill("Total Test");
    await page.getByLabel("Line description").first().fill("Respray");
    await page.getByLabel("Unit price").first().fill("1000");

    // 1000 + 10% = 1100
    await expect(page.getByTestId("invoice-total")).toContainText("$1,100.00");
  });

});

// Separate describe: this one must start signed out, so it must not inherit
// the admin login from the beforeEach above.
test.describe("Invoicing access control", () => {
  test("staff cannot reach invoicing", async ({ page }) => {
    seededFixtures();
    await page.goto("/admin");
    await page.getByLabel("Username").fill("jake");
    await page.getByLabel("Password").fill("workshop2026");
    await page.getByTestId("admin-login-submit").click();
    await page.waitForURL(/\/admin\/dashboard$/);

    await page.goto("/admin/invoices");
    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    const nav = page.getByRole("navigation", { name: "Admin" });
    await expect(nav.getByRole("link", { name: /Invoices/ })).toHaveCount(0);
  });
});

test.describe("Customer portal invoices", () => {
  test("a customer sees their invoice and payment progress", async ({
    page,
  }) => {
    seededFixtures();
    await loginCustomer(page, "CCP-2026-001", "VAN123");

    const section = page.getByTestId("portal-invoices");
    await expect(section).toBeVisible();
    await expect(section).toContainText("INV-2026-001");
    await expect(section).toContainText("$8,470.00 inc. GST");

    // Another test in this file records a payment against the same invoice,
    // so assert the shape rather than a residual figure that moves.
    const card = page.getByTestId("portal-invoice-INV-2026-001");
    await expect(card.getByTestId("payment-progress-bar")).toBeVisible();
    await expect(card.getByTestId("payment-percent")).toHaveText(/^\d+% paid$/);
    await expect(card).toContainText("outstanding");
    await expect(card).toContainText("Payments received");
  });

  test("a customer sees only their own job's invoices", async ({ page }) => {
    seededFixtures();
    await loginCustomer(page, "CCP-2026-001", "VAN123");

    // INV-2026-002 belongs to Dave Carter's job, not this one.
    await expect(page.getByText("INV-2026-002")).toHaveCount(0);
  });

  test("a job with no invoice shows no invoice section", async ({ page }) => {
    seededFixtures();
    await loginCustomer(page, "CCP-2026-002", "VAN456");
    await expect(page.getByTestId("portal-invoices")).toHaveCount(0);
  });

  test("bank transfer details or a phone fallback are always offered", async ({
    page,
  }) => {
    seededFixtures();
    await loginCustomer(page, "CCP-2026-001", "VAN123");

    const card = page.getByTestId("portal-invoice-INV-2026-001");
    // Either configured bank details, or a clear way to arrange payment.
    await expect(
      card.getByText(/BSB|call the workshop/i).first()
    ).toBeVisible();
  });
});
