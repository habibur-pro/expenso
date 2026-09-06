/**
 * UTC-based date helpers for the dashboard. Expenses are stored at UTC
 * midnight (see `POST /api/expenses`), so month boundaries and any date
 * shown back to the user must be computed in UTC too — using local time
 * here would silently shift expenses near a month or day boundary into the
 * wrong bucket depending on the viewer's timezone.
 */

/**
 * The half-open `[start, end)` UTC boundaries of a calendar month.
 * `monthOffset` shifts by whole months relative to `reference` — e.g. `-1`
 * for "the month before `reference`'s month".
 */
export function getMonthRange(
  reference: Date,
  monthOffset = 0,
): { start: Date; end: Date } {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth() + monthOffset;

  return {
    start: new Date(Date.UTC(year, month, 1)),
    end: new Date(Date.UTC(year, month + 1, 1)),
  };
}

/** Formats a date as e.g. "March 2026", using UTC so it matches `getMonthRange`. */
export function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Formats a date as e.g. "Mar 5", using UTC so it matches the stored expense date. */
export function formatDayMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
