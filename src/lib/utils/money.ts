/**
 * Money helpers shared by validation, services, and UI. Amounts are always
 * handled as integer minor units (e.g. cents) — never as floating-point
 * numbers — so `toMinorUnits` works on the raw string a user typed rather
 * than parsing it into a float first.
 */

/**
 * Converts a decimal amount string (already validated to match
 * `^\d{1,9}(\.\d{1,2})?$`) into integer minor units, e.g. "12.5" -> 1250.
 * Operates on the string's digits directly so no floating-point rounding
 * error can ever enter a monetary value.
 */
export function toMinorUnits(amount: string): number {
  const [wholePart, fractionPart = ""] = amount.trim().split(".");
  const paddedFraction = (fractionPart + "00").slice(0, 2);

  return Number(`${wholePart}${paddedFraction}`);
}

/**
 * Formats integer minor units as a currency string for display, e.g.
 * (1250, "BDT") -> "৳12.50". `narrowSymbol` is used so BDT renders as the
 * Taka sign rather than the literal code ("BDT 12.50") — `en-US` has no
 * built-in Bengali digit/symbol mapping otherwise.
 */
export function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(amountMinor / 100);
}
