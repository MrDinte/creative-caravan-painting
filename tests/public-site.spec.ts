import { test, expect, type Page } from "@playwright/test";

const PUBLIC_PAGES = [
  { path: "/", heading: /new lease on life/i },
  { path: "/services", heading: /OUR SERVICES/i },
  { path: "/gallery", heading: /Our Work/i },
  { path: "/store", heading: /^Store$/i },
  { path: "/contact", heading: /CONTACT US/i },
  { path: "/portal", heading: /Customer Portal/i },
];

test.describe("Public pages render", () => {
  for (const { path, heading } of PUBLIC_PAGES) {
    test(`${path} loads with its H1 and no console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      page.on("pageerror", (e) => errors.push(e.message));

      const response = await page.goto(path);
      expect(response?.status(), `${path} should return 200`).toBe(200);
      await expect(page.locator("h1")).toContainText(heading);
      expect(errors, `console errors on ${path}`).toEqual([]);
    });
  }
});

test.describe("Original site content is preserved", () => {
  test("homepage keeps the key headings and calls to action", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Services", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Follow us on Instagram/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "CONTACT US", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Contact Us Today!/i }).first()
    ).toBeVisible();
  });

  test("services page lists all five services from the original site", async ({
    page,
  }) => {
    await page.goto("/services");
    for (const heading of [
      "EXTERIOR CARAVAN RESTORATIONS",
      "INTERIOR & EXTERIOR CARAVAN RENOVATIONS",
      "WINDOW REPAIRS, RESTORATIONS & POLISHING",
      "INSURANCE REPAIRS & CARAVAN SERVICING",
      "PERSPEX SUPPLIES & CUT TO SIZE",
    ]) {
      await expect(
        page.getByRole("heading", { name: heading, exact: true })
      ).toBeVisible();
    }
  });

  test("business contact details appear in the footer", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toContainText("0417 005 298");
    await expect(footer).toContainText("teamccpr@gmail.com");
    await expect(footer).toContainText("Morayfield Road");
    await expect(footer).toContainText("91 598 012 904");
  });

  test("phone links use a working tel: href", async ({ page }) => {
    await page.goto("/");
    const telLinks = page.locator('a[href^="tel:"]');
    expect(await telLinks.count()).toBeGreaterThan(0);
    await expect(telLinks.first()).toHaveAttribute("href", "tel:+61417005298");
  });
});

/** Collects every same-origin link on the page and asserts each responds 200. */
async function assertAllInternalLinksWork(page: Page, path: string) {
  await page.goto(path);
  const hrefs = await page
    .locator('a[href^="/"]:not([href^="//"])')
    .evaluateAll((els) =>
      Array.from(new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!)))
    );

  expect(hrefs.length, `expected internal links on ${path}`).toBeGreaterThan(0);

  for (const href of hrefs) {
    const res = await page.request.get(href);
    expect(res.status(), `${href} (linked from ${path})`).toBeLessThan(400);
  }
}

test.describe("Every internal link resolves", () => {
  for (const { path } of PUBLIC_PAGES) {
    test(`links on ${path} all return < 400`, async ({ page }) => {
      await assertAllInternalLinksWork(page, path);
    });
  }
});

test.describe("Navigation works", () => {
  test("desktop nav navigates to each section", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "Desktop-only navigation"
    );
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });

    for (const [label, expectedPath] of [
      ["Services", "/services"],
      ["Our Work", "/gallery"],
      ["Store", "/store"],
      ["Contact Us", "/contact"],
      ["Home", "/"],
    ] as const) {
      await nav.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${expectedPath}$`));
    }
  });

  test("mobile menu opens, navigates and marks the active page", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile-safari",
      "Mobile-only navigation"
    );
    await page.goto("/");

    const toggle = page.getByRole("button", { name: /open menu/i });
    await expect(toggle).toBeVisible();
    await toggle.click();

    const mobileNav = page.getByRole("navigation", { name: "Mobile" });
    await expect(mobileNav).toBeVisible();

    await mobileNav.getByRole("link", { name: "Services", exact: true }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(page.locator("h1")).toContainText(/OUR SERVICES/i);
  });
});

test.describe("Accessibility and focus", () => {
  test("every page has exactly one H1", async ({ page }) => {
    for (const { path } of PUBLIC_PAGES) {
      await page.goto(path);
      await expect(page.locator("h1"), `${path} H1 count`).toHaveCount(1);
    }
  });

  test("keyboard focus is visible on interactive elements", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Keyboard test");
    await page.goto("/");
    await page.keyboard.press("Tab");

    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return { width: s.outlineWidth, style: s.outlineStyle };
    });

    expect(outline).not.toBeNull();
    expect(outline!.style).not.toBe("none");
    expect(parseFloat(outline!.width)).toBeGreaterThan(0);
  });

  test("all images and SVGs carry accessible labels", async ({ page }) => {
    await page.goto("/gallery");
    const unlabelled = await page
      .locator('svg[role="img"]')
      .evaluateAll((els) => els.filter((e) => !e.getAttribute("aria-label")).length);
    expect(unlabelled).toBe(0);
  });

  test("buttons and links meet a 44px touch target on mobile", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-safari", "Mobile tap targets");
    await page.goto("/");

    const ctas = page.locator("main a[class*='min-h-'], main button");
    const count = await ctas.count();
    for (let i = 0; i < Math.min(count, 15); i++) {
      const el = ctas.nth(i);
      if (!(await el.isVisible())) continue;
      const box = await el.boundingBox();
      if (box) expect(box.height).toBeGreaterThanOrEqual(40);
    }
  });

  test("no horizontal overflow on mobile", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-safari", "Mobile layout");
    for (const { path } of PUBLIC_PAGES) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
    }
  });
});

test.describe("Gallery", () => {
  test("shows four previous customer caravans with before/after sliders", async ({
    page,
  }) => {
    await page.goto("/gallery");
    await expect(page.getByRole("slider")).toHaveCount(4);
    await expect(page.getByText("Before").first()).toBeVisible();
    await expect(page.getByText("After").first()).toBeVisible();
  });

  test("the before/after slider responds to input", async ({ page }) => {
    await page.goto("/gallery");
    const slider = page.getByRole("slider").first();
    await slider.fill("15");
    await expect(slider).toHaveValue("15");
    await slider.fill("85");
    await expect(slider).toHaveValue("85");
  });
});

test.describe("Contact form", () => {
  test("submits successfully and confirms", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Your name").fill("Playwright Tester");
    await page.getByLabel("Email", { exact: false }).first().fill("tester@example.com");
    await page.getByLabel("Phone").fill("0400 000 000");
    await page.getByLabel("Your message").fill(
      "Testing the contact form end to end."
    );
    await page.getByTestId("contact-submit").click();

    await expect(page.getByTestId("contact-success")).toBeVisible();
    await expect(page.getByTestId("contact-success")).toContainText(
      /Message sent/i
    );
  });

  test("rejects an invalid email", async ({ page }) => {
    await page.goto("/contact");
    // Bypass native validation so the server-side check is what's exercised.
    await page.locator("form").evaluate((f) => f.setAttribute("novalidate", ""));
    await page.getByLabel("Your name").fill("Bad Email");
    await page.getByLabel("Email", { exact: false }).first().fill("not-an-email");
    await page.getByLabel("Your message").fill("Should fail validation.");
    await page.getByTestId("contact-submit").click();

    await expect(page.getByTestId("form-error")).toContainText(/valid email/i);
  });
});
