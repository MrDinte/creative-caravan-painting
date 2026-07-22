// Queensland does not observe daylight saving, so Brisbane is a fixed UTC+10
// all year. That makes the arithmetic exact — no timezone database needed.
export const BRISBANE_OFFSET_MINUTES = 10 * 60;

export function toBrisbane(date: Date): Date {
  return new Date(date.getTime() + BRISBANE_OFFSET_MINUTES * 60_000);
}

/** Calendar date in Brisbane, as YYYY-MM-DD. */
export function brisbaneDate(date: Date = new Date()): string {
  return toBrisbane(date).toISOString().slice(0, 10);
}

/** Wall-clock time in Brisbane, as HH:MM. */
export function brisbaneTime(date: Date = new Date()): string {
  return toBrisbane(date).toISOString().slice(11, 16);
}

export function brisbaneLabel(date: Date = new Date()): string {
  const b = toBrisbane(date);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${days[b.getUTCDay()]} ${b.getUTCDate()} ${months[b.getUTCMonth()]}`;
}

/** Hours between two instants, rounded to the nearest quarter hour. */
export function hoursBetween(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.round((ms / 3_600_000) * 4) / 4;
}

export function formatElapsed(startIso: string, now: Date = new Date()): string {
  const ms = Math.max(0, now.getTime() - new Date(startIso).getTime());
  const totalMinutes = Math.floor(ms / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
