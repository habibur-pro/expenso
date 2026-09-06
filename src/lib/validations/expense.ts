import { z } from "zod";
import { toMinorUnits } from "@/lib/utils/money";

/**
 * Validates and shapes the body of `POST /api/expenses`. Imported by both
 * the server route (the real gate) and the client form (instant feedback)
 * — kept free of `server-only` so it works on both sides. Zod can only
 * prove `categoryId` is a well-formed ObjectId; existence and ownership
 * are verified against the database in the service layer.
 */

const AMOUNT_PATTERN = /^\d{1,9}(\.\d{1,2})?$/;
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

// 999,999,999.99 expressed in minor units — a sane ceiling, not a real limit.
const MAX_AMOUNT_MINOR = 99_999_999_999;

const MIN_DATE = "2000-01-01";

function tomorrowUtc(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export const createExpenseSchema = z
  .object({
    amount: z
      .string("Enter an amount.")
      .trim()
      .min(1, "Enter an amount.")
      .regex(AMOUNT_PATTERN, "Enter a valid amount, like 12.50.")
      .transform((value, ctx) => {
        const amountMinor = toMinorUnits(value);

        if (amountMinor <= 0) {
          ctx.addIssue({
            code: "custom",
            message: "Amount must be greater than 0.",
          });
          return z.NEVER;
        }

        if (amountMinor > MAX_AMOUNT_MINOR) {
          ctx.addIssue({
            code: "custom",
            message: "Enter a valid amount, like 12.50.",
          });
          return z.NEVER;
        }

        return amountMinor;
      }),
    categoryId: z
      .string("Choose a category.")
      .regex(OBJECT_ID_PATTERN, "Choose a valid category."),
    date: z.iso
      .date("Enter a valid date.")
      .refine(
        (value) => value >= MIN_DATE,
        "Enter a date on or after Jan 1, 2000.",
      )
      .refine(
        (value) => value <= tomorrowUtc(),
        "The date can't be in the future.",
      ),
    description: z
      .string()
      .trim()
      .max(200, "Keep the description under 200 characters.")
      .optional()
      .transform((value) => (value ? value : null)),
  })
  .strict();

export type CreateExpenseInput = z.input<typeof createExpenseSchema>;
export type CreateExpenseOutput = z.output<typeof createExpenseSchema>;
