/**
 * A minimal fixed set of categories seeded for a user the first time they
 * open the add-expense page — because `Expense.categoryId` is required and
 * no category-management UI exists yet. This is deliberately the smallest
 * set that makes the form usable, not a category-management feature.
 */
export const DEFAULT_CATEGORY_NAMES = [
  "Groceries",
  "Dining",
  "Transport",
  "Housing",
  "Utilities",
  "Health",
  "Entertainment",
  "Shopping",
  "Other",
] as const;

/**
 * Normalizes a category name into the slug form stored in
 * `Category.slug` (lowercase, trimmed, kebab-case), matching the
 * convention established in the database schema (step 02): uniqueness of
 * `[userId, slug]` is enforced by the database, and this function is the
 * single place that produces the value that constraint checks.
 */
export function toCategorySlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
