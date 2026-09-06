import "server-only";

import { prisma } from "@/lib/prisma";

type CreateExpenseInput = {
  userId: string;
  categoryId: string;
  amountMinor: number;
  currency: string;
  date: Date;
  description: string | null;
};

type CreatedExpense = {
  id: string;
  amountMinor: number;
  currency: string;
  date: Date;
  categoryId: string;
  categoryName: string;
  description: string | null;
};

type CreateExpenseResult =
  | { ok: true; expense: CreatedExpense }
  | { ok: false; reason: "category_not_found" };

/**
 * Creates one expense for `userId`. The caller-supplied `categoryId` is
 * treated as untrusted: ownership is verified in the same query
 * (`where: { id, userId }`) before any write, so a category that doesn't
 * exist and a category owned by someone else produce the identical
 * `category_not_found` result — no signal that distinguishes them.
 */
export async function createExpense(
  input: CreateExpenseInput,
): Promise<CreateExpenseResult> {
  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, userId: input.userId },
    select: { id: true, name: true },
  });

  if (!category) {
    return { ok: false, reason: "category_not_found" };
  }

  const expense = await prisma.expense.create({
    data: {
      userId: input.userId,
      categoryId: category.id,
      amountMinor: input.amountMinor,
      currency: input.currency,
      date: input.date,
      description: input.description,
    },
    select: {
      id: true,
      amountMinor: true,
      currency: true,
      date: true,
      categoryId: true,
      description: true,
    },
  });

  return {
    ok: true,
    expense: { ...expense, categoryName: category.name },
  };
}
