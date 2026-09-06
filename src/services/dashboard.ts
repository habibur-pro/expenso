import "server-only";

import { prisma } from "@/lib/prisma";
import { CURRENCY } from "@/lib/constants/currency";
import { getMonthRange } from "@/lib/utils/date-range";

export type TopCategory = {
  id: string;
  name: string;
  totalMinor: number;
  sharePercent: number;
};

export type RecentExpense = {
  id: string;
  amountMinor: number;
  date: Date;
  description: string | null;
  categoryName: string;
};

export type DashboardSummary = {
  month: {
    totalMinor: number;
    expenseCount: number;
    dailyAverageMinor: number;
  };
  previousMonth: { totalMinor: number };
  changePercent: number | null;
  topCategories: TopCategory[];
  recentExpenses: RecentExpense[];
  hasAnyExpenses: boolean;
};

const MAX_TOP_CATEGORIES = 5;
const MAX_RECENT_EXPENSES = 5;

/**
 * Builds the dashboard overview for `userId` entirely through database-side
 * aggregation — no expense row is ever fetched in bulk and reduced in
 * JavaScript. Every query is scoped to `userId` (and `CURRENCY`, since
 * Expenso is BDT-only) so this can never return another user's data or mix
 * in a stray non-BDT row.
 */
export async function getDashboardSummary(
  userId: string,
): Promise<DashboardSummary> {
  const now = new Date();
  const currentMonth = getMonthRange(now);
  const previousMonth = getMonthRange(now, -1);

  const [monthAgg, previousMonthAgg, groupedCategories, recentExpenseRows] =
    await Promise.all([
      prisma.expense.aggregate({
        where: {
          userId,
          currency: CURRENCY,
          date: { gte: currentMonth.start, lt: currentMonth.end },
        },
        _sum: { amountMinor: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: {
          userId,
          currency: CURRENCY,
          date: { gte: previousMonth.start, lt: previousMonth.end },
        },
        _sum: { amountMinor: true },
      }),
      prisma.expense.groupBy({
        by: ["categoryId"],
        where: {
          userId,
          currency: CURRENCY,
          date: { gte: currentMonth.start, lt: currentMonth.end },
        },
        _sum: { amountMinor: true },
        orderBy: { _sum: { amountMinor: "desc" } },
        take: MAX_TOP_CATEGORIES,
      }),
      prisma.expense.findMany({
        where: { userId, currency: CURRENCY },
        orderBy: { date: "desc" },
        take: MAX_RECENT_EXPENSES,
        select: {
          id: true,
          amountMinor: true,
          date: true,
          description: true,
          category: { select: { name: true } },
        },
      }),
    ]);

  const monthTotalMinor = monthAgg._sum.amountMinor ?? 0;
  const previousMonthTotalMinor = previousMonthAgg._sum.amountMinor ?? 0;
  const daysElapsed = now.getUTCDate();

  const changePercent =
    previousMonthTotalMinor === 0
      ? null
      : Math.round(
          ((monthTotalMinor - previousMonthTotalMinor) /
            previousMonthTotalMinor) *
            100,
        );

  // A second, userId-scoped lookup for the names of the grouped categories —
  // one bounded query rather than one per category, and scoped by userId as
  // an ownership check independent of the groupBy's own userId filter.
  const categoryIds = groupedCategories.map((group) => group.categoryId);
  const categoryNamesById = new Map(
    categoryIds.length === 0
      ? []
      : (
          await prisma.category.findMany({
            where: { id: { in: categoryIds }, userId },
            select: { id: true, name: true },
          })
        ).map((category) => [category.id, category.name] as const),
  );

  const topCategories: TopCategory[] = groupedCategories
    .map((group) => {
      const totalMinor = group._sum.amountMinor ?? 0;
      return {
        id: group.categoryId,
        name: categoryNamesById.get(group.categoryId) ?? "Unknown",
        totalMinor,
        sharePercent:
          monthTotalMinor === 0
            ? 0
            : Math.round((totalMinor / monthTotalMinor) * 100),
      };
    })
    .filter((category) => categoryNamesById.has(category.id));

  const recentExpenses: RecentExpense[] = recentExpenseRows.map((expense) => ({
    id: expense.id,
    amountMinor: expense.amountMinor,
    date: expense.date,
    description: expense.description,
    categoryName: expense.category.name,
  }));

  return {
    month: {
      totalMinor: monthTotalMinor,
      expenseCount: monthAgg._count,
      dailyAverageMinor: Math.round(monthTotalMinor / daysElapsed),
    },
    previousMonth: { totalMinor: previousMonthTotalMinor },
    changePercent,
    topCategories,
    recentExpenses,
    hasAnyExpenses: recentExpenses.length > 0,
  };
}
