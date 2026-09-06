import type { RecentExpense } from "@/services/dashboard";
import { formatMoney } from "@/lib/utils/money";
import { formatDayMonth } from "@/lib/utils/date-range";

type RecentExpensesProps = {
  expenses: RecentExpense[];
  currency: string;
};

/**
 * The five most recent expenses across any month. Deliberately has no
 * "View all" link — there is no expense-history page yet, and a link to
 * one would be dead.
 */
export function RecentExpenses({ expenses, currency }: RecentExpensesProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-foreground">Recent expenses</h2>

      {expenses.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No expenses recorded yet.
        </p>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-border">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {expense.categoryName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDayMonth(expense.date)}
                    {expense.description ? ` · ${expense.description}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                  {formatMoney(expense.amountMinor, currency)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Showing the 5 most recent expenses.
          </p>
        </>
      )}
    </section>
  );
}
