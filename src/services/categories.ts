import "server-only";

import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CATEGORY_NAMES,
  toCategorySlug,
} from "@/lib/constants/categories";

const PRISMA_UNIQUE_CONSTRAINT_ERROR = "P2002";

/**
 * Seeds the fixed default category set for a user the first time they have
 * none. Idempotent: a second call (including a concurrent one racing this
 * one) is a no-op because `@@unique([userId, slug])` rejects the duplicate
 * insert, which is caught and treated as success rather than surfaced as
 * an error. This is the minimum needed to make the add-expense form
 * usable — not category management.
 */
export async function ensureDefaultCategories(userId: string): Promise<void> {
  const existingCount = await prisma.category.count({ where: { userId } });

  if (existingCount > 0) {
    return;
  }

  for (const name of DEFAULT_CATEGORY_NAMES) {
    try {
      await prisma.category.create({
        data: { userId, name, slug: toCategorySlug(name) },
      });
    } catch (error) {
      const isDuplicate =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR;

      if (!isDuplicate) {
        throw error;
      }
    }
  }
}

/**
 * Returns the authenticated user's categories for the add-expense form.
 * Scoped by `userId` and bounded — never an unbounded fetch.
 */
export async function listCategories(
  userId: string,
): Promise<{ id: string; name: string }[]> {
  return prisma.category.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 50,
  });
}

type CreateCategoryResult =
  | { ok: true; category: { id: string; name: string } }
  | { ok: false; reason: "duplicate" };

/**
 * Creates one category for `userId`, letting a user add a category inline
 * from the add-expense modal without leaving it. The slug is always
 * derived server-side (never accepted from the client); a name that
 * normalizes to a slug the user already has is reported as a duplicate
 * rather than a raw unique-constraint error.
 */
export async function createCategory(
  userId: string,
  name: string,
): Promise<CreateCategoryResult> {
  try {
    const category = await prisma.category.create({
      data: { userId, name, slug: toCategorySlug(name) },
      select: { id: true, name: true },
    });

    return { ok: true, category };
  } catch (error) {
    const isDuplicate =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR;

    if (!isDuplicate) {
      throw error;
    }

    return { ok: false, reason: "duplicate" };
  }
}
