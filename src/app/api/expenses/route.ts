import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { CURRENCY } from "@/lib/constants/currency";
import { createExpenseSchema } from "@/lib/validations/expense";
import { createExpense } from "@/services/expenses";

/**
 * Shared error response shape for this route: `{ error: { message, fields? } }`.
 * `fields` carries per-field messages from Zod, never a raw `ZodError`.
 * Kept local to this file — extract a shared helper once a second route
 * needs the same shape.
 */
function errorResponse(
  status: number,
  message: string,
  fields?: Record<string, string>,
) {
  return NextResponse.json({ error: { message, fields } }, { status });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return errorResponse(401, "You need to sign in to add an expense.");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "That request wasn't formatted correctly.");
  }

  const parsed = createExpenseSchema.safeParse(body);

  if (!parsed.success) {
    const fields: Record<string, string> = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in fields)) {
        fields[field] = issue.message;
      }
    }

    return errorResponse(400, "Please fix the highlighted fields.", fields);
  }

  const { amount: amountMinor, categoryId, date, description } = parsed.data;

  try {
    const result = await createExpense({
      userId: session.user.id,
      categoryId,
      amountMinor,
      currency: CURRENCY,
      date: new Date(`${date}T00:00:00.000Z`),
      description,
    });

    if (!result.ok) {
      return errorResponse(404, "That category is no longer available.");
    }

    const { expense } = result;

    return NextResponse.json(
      {
        data: {
          id: expense.id,
          amountMinor: expense.amountMinor,
          currency: expense.currency,
          date: expense.date.toISOString(),
          categoryId: expense.categoryId,
          categoryName: expense.categoryName,
          description: expense.description,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create expense:", error);
    return errorResponse(500, "Unable to add the expense. Please try again.");
  }
}
