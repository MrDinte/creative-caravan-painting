import { test, type Page } from "@playwright/test";

/**
 * Several tests create rows (jobs, quotes, staff, price rates) that have no
 * delete path in the UI. Run against a deployed, database-backed site those
 * rows accumulate permanently in real data.
 *
 * They run by default locally, where the store is in-memory and resets. When
 * BASE_URL points at a deployment they are skipped, unless ALLOW_WRITE_TESTS=1
 * is set to opt in deliberately.
 */
export const writesData = () =>
  test.skip(
    Boolean(process.env.BASE_URL) && process.env.ALLOW_WRITE_TESTS !== "1",
    "Creates rows with no cleanup path — skipped against a deployed database. Set ALLOW_WRITE_TESTS=1 to include."
  );

/**
 * Asserts against the seeded demo dataset — specific people, hours and totals.
 * A real database holds whatever the business has actually entered, so these
 * only run locally where the in-memory fixtures are guaranteed.
 */
export const seededFixtures = () =>
  test.skip(
    Boolean(process.env.BASE_URL),
    "Depends on the seeded demo dataset — skipped against a real database."
  );

/**
 * Console noise that isn't this application's fault.
 *
 *  - `_rsc=`      WebKit reports "access control checks" for Next.js RSC link
 *                 prefetches. A browser quirk; the routes themselves are
 *                 covered by the link tests.
 *  - `vercel.live` Vercel injects its preview feedback toolbar into preview
 *                 deployments only, and that script throws on WebKit
 *                 (`navigator.storage` is undefined there). It is absent from
 *                 production, and nothing in this repo loads it.
 *
 * Matched against the message *and* the stack, because the interesting
 * identifier is often only in the stack — the toolbar's error message is a
 * bare TypeError that names no origin.
 */
const IGNORABLE = [/_rsc=/, /vercel\.live/];

export function isIgnorableConsoleError(...parts: (string | undefined)[]) {
  const text = parts.filter(Boolean).join("\n");
  return IGNORABLE.some((re) => re.test(text));
}

/**
 * Records genuine page/console errors onto `sink`, filtering the noise above.
 */
export function collectConsoleErrors(page: Page, sink: string[]) {
  page.on("pageerror", (e) => {
    if (!isIgnorableConsoleError(e.message, e.stack)) sink.push(e.message);
  });
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (!isIgnorableConsoleError(m.text())) sink.push(m.text());
  });
}
