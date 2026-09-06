/**
 * Expenso supports exactly one currency: Bangladeshi Taka. There is no
 * currency selector and no multi-currency support — every expense is
 * created, stored, and displayed in BDT. See CLAUDE.md ("Validation &
 * Money"). Never accept a client-supplied `currency`.
 */
export const CURRENCY = "BDT";
