import { test, expect, type Page } from "@playwright/test";
import { seededFixtures, writesData } from "./helpers";

async function loginAs(page: Page, username: string, password: string) {
  await page.goto("/admin");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByTestId("admin-login-submit").click();
  await page.waitForURL(/\/admin\/dashboard$/);
}

test.describe("Clock on / off", () => {
  test("the clock card is the first thing a staff member sees", async ({
    page,
  }) => {
    seededFixtures();
    await loginAs(page, "jake", "workshop2026");

    const card = page.getByTestId("clock-card");
    await expect(card).toBeVisible();
    await expect(page.getByTestId("clock-on")).toBeVisible();
    await expect(card).toContainText("Brisbane time");
  });

  test("the Brisbane clock shows a sensible time", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "jake", "workshop2026");

    const clock = page.getByTestId("brisbane-clock");
    await expect(clock).toBeVisible();
    await expect(clock).toHaveText(/^([01]\d|2[0-3]):[0-5]\d$/);

    // Brisbane is a fixed UTC+10, so the rendered time must match that offset.
    const expected = new Date(Date.now() + 10 * 60 * 60 * 1000)
      .toISOString()
      .slice(11, 16);
    const shown = (await clock.textContent())!.trim();
    const minutesApart = Math.abs(
      Number(shown.slice(0, 2)) * 60 +
        Number(shown.slice(3)) -
        (Number(expected.slice(0, 2)) * 60 + Number(expected.slice(3)))
    );
    expect(minutesApart).toBeLessThanOrEqual(2);
  });

  test("clocking on starts a running timer, clocking off records hours", async ({
    page,
  }) => {
    seededFixtures();
    writesData();
    await loginAs(page, "mel", "workshop2026");

    await page.getByTestId("clock-on").click();
    await expect(page.getByRole("status")).toContainText(/Clocked on at/);
    await expect(page.getByTestId("elapsed-timer")).toBeVisible();
    await expect(page.getByTestId("clock-off")).toBeVisible();

    // Straight back off: under 15 minutes rounds to zero and records nothing,
    // which is the documented behaviour rather than a zero-hour row.
    await page.getByTestId("clock-off").click();
    await expect(page.getByRole("status")).toContainText(
      /under 15 minutes, so nothing was recorded|Clocked off at/
    );

    // Reload rather than racing the revalidation, so this asserts the stored
    // state rather than whatever the page happens to be mid-refresh.
    await page.reload();
    await expect(page.getByTestId("clock-on")).toBeVisible();
    await expect(page.getByTestId("elapsed-timer")).toHaveCount(0);
  });

  test("the owner account has no clock card — it isn't a person", async ({
    page,
  }) => {
    await loginAs(page, "admin", "caravan2026");
    await expect(page.getByTestId("clock-card")).toHaveCount(0);
  });
});

test.describe("Dashboard location filter", () => {
  test("filters the job list by location", async ({ page }) => {
    seededFixtures();
    await loginAs(page, "admin", "caravan2026");

    await expect(page.getByTestId("dash-loc-all")).toBeVisible();
    await expect(page.getByTestId("dash-loc-workshop")).toBeVisible();
    await expect(page.getByTestId("dash-loc-bellmere")).toBeVisible();

    await page.getByTestId("dash-loc-bellmere").click();
    await expect(page).toHaveURL(/loc=bellmere/);
    await expect(page.getByRole("heading", { name: /Jobs in Bellmere/ })).toBeVisible();

    // CCP-2026-003 is the seeded Bellmere job; -001 is in the workshop.
    await expect(page.getByText("CCP-2026-003")).toBeVisible();
    await expect(page.getByText("CCP-2026-001")).toHaveCount(0);

    await page.getByTestId("dash-loc-workshop").click();
    await expect(page.getByText("CCP-2026-001")).toBeVisible();
  });
});
