import { z } from "zod";

/**
 * Validates the body of `POST /api/categories`. Kept free of `server-only`
 * so it can also be used for the client-side pre-check in
 * `CreateCategoryControl`, matching the pattern in `@/lib/validations/expense`.
 */
export const createCategorySchema = z
  .object({
    name: z
      .string("Enter a category name.")
      .trim()
      .min(1, "Enter a category name.")
      .max(50, "Keep the name under 50 characters."),
  })
  .strict();

export type CreateCategoryInput = z.input<typeof createCategorySchema>;
export type CreateCategoryOutput = z.output<typeof createCategorySchema>;
