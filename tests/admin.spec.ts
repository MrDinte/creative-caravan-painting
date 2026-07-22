import { test, expect, type Page } from "@playwright/test";

const ADMIN_PAGES = [
  { path: "/admin/dashboard", heading: /Dashboard/i },
  { path: "/admin/calendar", heading: /Calendar/i },
  { path: "/admin/jobs", heading: /^Jobs$/i },
  { path: "/admin/tasks", heading: /Task Manager/i },
  { path: "/admin/quotes", heading: /^Quotes$/i },
  { path: "/admin/prices", heading: /Master Price Book/i },
  { path: "/admin/enquiries", heading: /Enquiries/i },
];

async function login(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("caravan2026");
  await page.getByTestId("admin-login-submit").click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

test.describe("Admin authentication", () => {
  test("every admin page redirects to login when signed out", async ({
    page,
  }) => {
    for (const { path } of ADMIN_PAGES) {
      await page.goto(path);
      await expect(page, `${path} should redirect`).toHaveURL(/\/admin$/);
    }
  });

  test("rejects bad credentials", async ({ page }) => {
    await page.goto("/admin");
    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByTestId("admin-login-submit").click();
    await expect(page.getByTestId("admin-login-error")).toContainText(
      /Incorrect/i
    );
  });

  test("signs in and out", async ({ page }) => {
    await login(page);
    await expect(page.getByText(/Signed in as/)).toBeVisible();
    await page.getByTestId("admin-logout").click();
    await expect(page).toHaveURL(/\/admin$/);
  });
});

test.describe("Admin pages", () => {
  test.beforeEach(async ({ page }) => login(page));

  for (const { path, heading } of ADMIN_PAGES) {
    test(`${path} loads without console errors`, async ({ page }) => {
      const errors: string[] = [];
      // WebKit reports "access control checks" for Next.js RSC link prefetches
      // (`?_rsc=`). It's a browser quirk, not an app fault — navigation to
      // these routes is covered by the link tests below.
      const isPrefetchNoise = (text: string) => text.includes("_rsc=");

      page.on("pageerror", (e) => {
        if (!isPrefetchNoise(e.message)) errors.push(e.message);
      });
      page.on("console", (m) => {
        if (m.type() !== "error") return;
        if (!isPrefetchNoise(m.text())) errors.push(m.text());
      });

      await page.goto(path);
      await expect(page.locator("h1")).toContainText(heading);
      expect(errors, `errors on ${path}`).toEqual([]);
    });
  }

  test("sidebar navigation reaches every section", async ({ page }) => {
    await page.goto("/admin/dashboard");
    const nav = page.getByRole("navigation", { name: "Admin" });

    for (const [label, url] of [
      ["Calendar", "/admin/calendar"],
      ["Jobs", "/admin/jobs"],
      ["Task Manager", "/admin/tasks"],
      ["Quotes", "/admin/quotes"],
      ["Price Book", "/admin/prices"],
      ["Enquiries", "/admin/enquiries"],
      ["Dashboard", "/admin/dashboard"],
    ] as const) {
      await nav.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(new RegExp(`${url}$`));
    }
  });

  // Checks are issued in parallel: against a remote, database-backed
  // deployment the sequential version exceeded the per-test timeout.
  test("all internal admin links resolve", async ({ page }) => {
    test.slow();

    const seen = new Set<string>();
    for (const { path } of ADMIN_PAGES) {
      await page.goto(path);
      const hrefs = await page
        .locator('a[href^="/"]')
        .evaluateAll((els) =>
          Array.from(
            new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!))
          )
        );
      hrefs.forEach((h) => seen.add(h));
    }

    expect(seen.size, "expected admin links to check").toBeGreaterThan(0);

    const results = await Promise.all(
      [...seen].map(async (href) => ({
        href,
        status: (await page.request.get(href)).status(),
      }))
    );

    const broken = results.filter((r) => r.status >= 400);
    expect(broken, `broken admin links: ${JSON.stringify(broken)}`).toEqual([]);
  });
});

test.describe("Calendar", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("renders a month grid with jobs and navigates months", async ({
    page,
  }) => {
    await page.goto("/admin/calendar?m=2026-07");
    await expect(page.getByText("July 2026")).toBeVisible();
    await expect(page.getByText("Mon").first()).toBeVisible();
    await expect(page.getByTitle(/CCP-2026-001/).first()).toBeVisible();

    await page.getByRole("link", { name: "Next month" }).click();
    await expect(page.getByText("August 2026")).toBeVisible();

    await page.getByRole("link", { name: "Previous month" }).click();
    await expect(page.getByText("July 2026")).toBeVisible();
  });

  test("clicking a calendar entry opens the job", async ({ page }) => {
    await page.goto("/admin/calendar?m=2026-07");
    await page.getByTitle(/CCP-2026-001/).first().click();
    await expect(page).toHaveURL(/\/admin\/jobs\//);
    await expect(page.locator("h1")).toContainText(/Full Exterior Respray/i);
  });
});

test.describe("Job and task management", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("creates a job with an auto-generated job code and access code", async ({
    page,
  }) => {
    await page.goto("/admin/jobs/new");
    await page.getByLabel("Job title").fill("Playwright Test Respray");
    await page.getByLabel("Customer name").fill("Test Customer");
    await page.getByLabel("Customer email").fill("test@example.com");
    await page.getByLabel(/Van make/).fill("Test Van 2020");
    await page.getByLabel("Scheduled start").fill("2026-09-01");
    await page.getByLabel("Scheduled end").fill("2026-09-10");
    await page.getByTestId("create-job-submit").click();

    const created = page.getByTestId("job-created");
    await expect(created).toBeVisible();
    await expect(created).toContainText(/CCP-\d{4}-\d{3}/);
    await expect(created).toContainText(/access code: VAN\d{3}/i);
  });

  test("rejects an end date before the start date", async ({ page }) => {
    await page.goto("/admin/jobs/new");
    await page.getByLabel("Job title").fill("Bad Dates");
    await page.getByLabel("Customer name").fill("Test");
    await page.getByLabel("Scheduled start").fill("2026-09-20");
    await page.getByLabel("Scheduled end").fill("2026-09-01");
    await page.getByTestId("create-job-submit").click();

    await expect(page.getByTestId("form-error")).toContainText(/End date must be/i);
  });

  test("adds a task that gets a sequential work ID", async ({ page }) => {
    await page.goto("/admin/jobs");
    await page.getByRole("link", { name: "CCP-2026-003" }).click();

    await page.getByPlaceholder("Sand and prep exterior panels").fill(
      "Playwright generated task"
    );
    // Assignee is now a dropdown fed from the staff list.
    await page.getByTestId("add-task-form").getByRole("combobox").selectOption("Tim");
    await page.getByTestId("add-task-submit").click();

    await expect(page.getByRole("status")).toContainText(
      /Work ID CCP-2026-003-W\d{2} created/
    );
  });

  test("advances a task through its statuses", async ({ page }) => {
    await page.goto("/admin/jobs");
    await page.getByRole("link", { name: "CCP-2026-003" }).click();

    // Other tests share the same server state, so assert the transition
    // relative to whatever the current status is rather than a fixed start.
    const CYCLE = ["To Do", "In Progress", "Done"] as const;
    const advance = page.getByTestId("task-advance-CCP-2026-003-W01");

    const label = (await advance.textContent()) ?? "";
    const current = CYCLE.find((s) => label.trim().startsWith(s));
    expect(current, `unexpected task button label: ${label}`).toBeTruthy();

    const next = CYCLE[(CYCLE.indexOf(current!) + 1) % CYCLE.length];
    await expect(advance).toContainText(`${current} → ${next}`);

    await advance.click();
    const after = CYCLE[(CYCLE.indexOf(next) + 1) % CYCLE.length];
    await expect(
      page.getByTestId("task-advance-CCP-2026-003-W01")
    ).toContainText(`${next} → ${after}`);
  });

  test("changes job status and it reaches the customer portal", async ({
    page,
  }) => {
    await page.goto("/admin/jobs");
    await page.getByRole("link", { name: "CCP-2026-002" }).click();
    await page.getByTestId("set-status-quality_check").click();
    await expect(page.getByText("Quality Check").first()).toBeVisible();

    // Verify from the customer's side.
    await page.getByTestId("admin-logout").click();
    await page.goto("/portal");
    await page.getByLabel("Job code").fill("CCP-2026-002");
    await page.getByLabel("Access code").fill("VAN456");
    await page.getByTestId("portal-login-submit").click();
    await expect(page.getByText("Quality Check").first()).toBeVisible();
  });

  test("a customer-visible update appears in the portal, an internal one does not", async ({
    page,
  }) => {
    await page.goto("/admin/jobs");
    await page.getByRole("link", { name: "CCP-2026-004" }).click();

    await page
      .getByPlaceholder("Base coat is down and looking great…")
      .fill("Visible progress note from Playwright");
    await page.getByTestId("add-update-submit").click();
    await expect(page.getByRole("status")).toContainText(/customer can see/i);

    await page
      .getByPlaceholder("Base coat is down and looking great…")
      .fill("Secret internal note from Playwright");
    await page.getByLabel(/Visible to the customer/).uncheck();
    await page.getByTestId("add-update-submit").click();
    await expect(page.getByRole("status")).toContainText(/Internal note saved/i);

    await page.getByTestId("admin-logout").click();
    await page.goto("/portal");
    await page.getByLabel("Job code").fill("CCP-2026-004");
    await page.getByLabel("Access code").fill("VAN321");
    await page.getByTestId("portal-login-submit").click();

    const updates = page.getByTestId("portal-updates");
    await expect(updates).toContainText("Visible progress note from Playwright");
    await expect(updates).not.toContainText("Secret internal note");
  });
});
