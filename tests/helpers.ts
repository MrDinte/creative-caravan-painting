import { test } from "@playwright/test";

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
