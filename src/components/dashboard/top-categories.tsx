import type { TopCategory } from "@/services/dashboard";
import { formatMoney } from "@/lib/utils/money";

type TopCategoriesProps = {
  categories: TopCategory[];
  currency: string;
};

/**
 * Up to five categories by this month's spend, each with its share of the
 * month as both a percentage (for screen readers and precision) and a
 * proportional bar (`aria-hidden`, since the percentage already carries
 * the value in text).
 */
export function TopCategories({ categories, currency }: TopCategoriesProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-foreground">Top categories</h2>

      {categories.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No spending recorded this month.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {categories.map((category) => (
            <li key={category.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium text-foreground">
                  {category.name}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatMoney(category.totalMinor, currency)} ·{" "}
                  {category.sharePercent}%
                </span>
              </div>
              <div
                aria-hidden="true"
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(category.sharePercent, 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
