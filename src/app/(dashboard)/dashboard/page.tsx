import type { Metadata } from "next";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { StatCard } from "@/components/dashboard/stat-card";
import { TopCategories } from "@/components/dashboard/top-categories";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import { requireSession } from "@/lib/auth-session";
import { CURRENCY } from "@/lib/constants/currency";
import { formatMoney } from "@/lib/utils/money";
import { formatMonthLabel } from "@/lib/utils/date-range";
import { ensureDefaultCategories, listCategories } from "@/services/categories";
import { getDashboardSummary } from "@/services/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default async function DashboardPage() {
  const session = await requireSession();
  const userId = session.user.id;

  await ensureDefaultCategories(userId);

  const [categories, summary] = await Promise.all([
    listCategories(userId),
    getDashboardSummary(userId),
  ]);

  const addExpenseButton = (
    <AddExpenseDialog categories={categories} currency={CURRENCY} />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Your spending in {formatMonthLabel(new Date())}
          </p>
        </div>
        <div className="sm:shrink-0">{addExpenseButton}</div>
      </div>

      {!summary.hasAnyExpenses ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Wallet
              aria-hidden="true"
              className="size-6 text-muted-foreground"
            />
          </span>
          <h2 className="text-lg font-semibold text-foreground">
            No expenses yet
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add your first expense to start seeing your spending summary here.
          </p>
          {addExpenseButton}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="This month"
              value={formatMoney(summary.month.totalMinor, CURRENCY)}
            />
            <StatCard
              label="Last month"
              value={formatMoney(summary.previousMonth.totalMinor, CURRENCY)}
              meta={
                summary.changePercent === null ? (
                  "No spending last month"
                ) : (
                  <span className="flex items-center gap-1">
                    {summary.changePercent >= 0 ? (
                      <TrendingUp aria-hidden="true" className="size-3.5" />
                    ) : (
                      <TrendingDown aria-hidden="true" className="size-3.5" />
                    )}
                    {summary.changePercent >= 0 ? "+" : ""}
                    {summary.changePercent}% vs last month
                  </span>
                )
              }
            />
            <StatCard
              label="Expenses"
              value={String(summary.month.expenseCount)}
            />
            <StatCard
              label="Daily average"
              value={formatMoney(summary.month.dailyAverageMinor, CURRENCY)}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopCategories
              categories={summary.topCategories}
              currency={CURRENCY}
            />
            <RecentExpenses
              expenses={summary.recentExpenses}
              currency={CURRENCY}
            />
          </div>
        </>
      )}
    </div>
  );
}
