import { test, expect } from "@playwright/test";

test.describe("Store browsing", () => {
  test("lists products grouped by category", async ({ page }) => {
    await page.goto("/store");
    await expect(
      page.getByRole("heading", { name: "Perspex & Windows" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Custom Perspex — Cut to Size/ }).first()
    ).toBeVisible();
    await expect(page.getByText("$45.00").first()).toBeVisible();
  });

  test("every product detail page loads", async ({ page }) => {
    await page.goto("/store");
    const slugs = await page
      .locator('a[href^="/store/"]')
      .evaluateAll((els) =>
        Array.from(
          new Set(
            els
              .map((e) => (e as HTMLAnchorElement).getAttribute("href")!)
              .filter((h) => h !== "/store/cart")
          )
        )
      );

    expect(slugs.length).toBeGreaterThanOrEqual(6);

    for (const href of slugs) {
      const res = await page.request.get(href);
      expect(res.status(), href).toBe(200);
    }
  });

  test("product page shows price, description and buy buttons", async ({
    page,
  }) => {
    await page.goto("/store/caravan-reseal-kit");
    await expect(page.locator("h1")).toContainText("Caravan Reseal Kit");
    await expect(page.getByText("$129.00").first()).toBeVisible();
    await expect(
      page.getByTestId("add-to-cart-caravan-reseal-kit").first()
    ).toBeVisible();
  });
});

test.describe("Cart", () => {
  test("shows an empty state before anything is added", async ({ page }) => {
    await page.goto("/store/cart");
    await expect(page.getByTestId("cart-empty")).toBeVisible();
  });

  test("adds an item, updates quantity and totals correctly", async ({
    page,
  }) => {
    await page.goto("/store/caravan-reseal-kit");
    await page.getByTestId("add-to-cart-caravan-reseal-kit").first().click();

    await page.goto("/store/cart");
    await expect(page.getByTestId("cart-line-caravan-reseal-kit")).toBeVisible();
    await expect(page.getByTestId("cart-total")).toContainText("$129.00");

    // Increase to 2 → $258.00
    await page
      .getByRole("button", { name: /Increase quantity of Caravan Reseal Kit/i })
      .click();
    await expect(page.getByTestId("qty-caravan-reseal-kit")).toHaveText("2");
    await expect(page.getByTestId("cart-total")).toContainText("$258.00");

    // Decrease back to 1
    await page
      .getByRole("button", { name: /Decrease quantity of Caravan Reseal Kit/i })
      .click();
    await expect(page.getByTestId("cart-total")).toContainText("$129.00");
  });

  test("cart persists across a page reload", async ({ page }) => {
    await page.goto("/store/gift-voucher-100");
    await page.getByTestId("add-to-cart-gift-voucher-100").first().click();

    await page.goto("/store/cart");
    await expect(page.getByTestId("cart-line-gift-voucher-100")).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("cart-line-gift-voucher-100")).toBeVisible();
  });

  test("removing the last item returns the empty state", async ({ page }) => {
    await page.goto("/store/perspex-cut-to-size");
    await page.getByTestId("add-to-cart-perspex-cut-to-size").first().click();

    await page.goto("/store/cart");
    await page
      .getByRole("button", { name: /Remove Custom Perspex/i })
      .click();
    await expect(page.getByTestId("cart-empty")).toBeVisible();
  });

  test("the header cart badge reflects the item count", async ({ page }) => {
    await page.goto("/store/exterior-polish-restore-kit");
    await page
      .getByTestId("add-to-cart-exterior-polish-restore-kit")
      .first()
      .click();

    const cartLink = page.getByTestId(/cart-link/).first();
    await expect(cartLink).toContainText("1");
  });

  test("Buy now sends you straight to the cart", async ({ page }) => {
    await page.goto("/store/gift-voucher-100");
    await page.getByRole("button", { name: "Buy now" }).click();
    await expect(page).toHaveURL(/\/store\/cart$/);
    await expect(page.getByTestId("cart-line-gift-voucher-100")).toBeVisible();
  });
});

test.describe("Checkout", () => {
  test("completes an order in demo mode", async ({ page }) => {
    await page.goto("/store/caravan-reseal-kit");
    await page.getByTestId("add-to-cart-caravan-reseal-kit").first().click();

    await page.goto("/store/cart");
    await page.getByLabel("Your name").fill("Test Buyer");
    await page.getByLabel("Email").fill("buyer@example.com");
    await page.getByTestId("checkout-button").click();

    await expect(page.getByTestId("order-success")).toBeVisible();
    await expect(page.getByTestId("order-success")).toContainText(
      /Order received/i
    );
  });

  test("blocks checkout with an invalid email", async ({ page }) => {
    await page.goto("/store/gift-voucher-100");
    await page.getByTestId("add-to-cart-gift-voucher-100").first().click();

    await page.goto("/store/cart");
    await page
      .locator("form")
      .first()
      .evaluate((f) => f.setAttribute("novalidate", ""));
    await page.getByLabel("Your name").fill("Bad Email");
    await page.getByLabel("Email").fill("nope");
    await page.getByTestId("checkout-button").click();

    await expect(page.getByTestId("form-error")).toContainText(/valid email/i);
  });
});
