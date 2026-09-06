import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { createCategorySchema } from "@/lib/validations/category";
import { createCategory } from "@/services/categories";

/**
 * Shared error response shape for this route: `{ error: { message, fields? } }`.
 * Mirrors `@/app/api/expenses/route.ts` — kept local to each file until a
 * third route needs the same shape.
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
    return errorResponse(401, "You need to sign in to create a category.");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "That request wasn't formatted correctly.");
  }

  const parsed = createCategorySchema.safeParse(body);

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

  try {
    const result = await createCategory(session.user.id, parsed.data.name);

    if (!result.ok) {
      return errorResponse(409, "You already have a category with that name.");
    }

    return NextResponse.json({ data: result.category }, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return errorResponse(
      500,
      "Unable to create the category. Please try again.",
    );
  }
}
