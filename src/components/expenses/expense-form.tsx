"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateCategoryControl } from "@/components/expenses/create-category-control";
import { createExpenseSchema } from "@/lib/validations/expense";
import { formatMoney } from "@/lib/utils/money";

type ExpenseFormProps = {
  categories: { id: string; name: string }[];
  currency: string;
};

type FormValues = {
  amount: string;
  categoryId: string;
  date: string;
  description: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const FIELD_ORDER = ["amount", "categoryId", "date", "description"] as const;

const GENERIC_ERROR_MESSAGE =
  "We couldn't save that expense. Please try again.";

function getCurrencySymbol(currency: string): string {
  const part = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  })
    .formatToParts(0)
    .find((piece) => piece.type === "currency");

  return part?.value ?? currency;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The add-expense form: four fields, client-side Zod validation for
 * instant feedback, and a `fetch` to `POST /api/expenses` that treats the
 * server's response as the real gate. Holds no business logic beyond form
 * state and the request itself — validation rules and money handling live
 * in `@/lib/validations/expense` and `@/lib/utils/money`.
 */
export function ExpenseForm({
  categories: initialCategories,
  currency,
}: ExpenseFormProps) {
  const router = useRouter();
  const amountInputRef = useRef<HTMLInputElement>(null);
  const categoryTriggerRef = useRef<HTMLButtonElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState(initialCategories);
  const [values, setValues] = useState<FormValues>(() => ({
    amount: "",
    categoryId: initialCategories[0]?.id ?? "",
    date: todayIsoDate(),
    description: "",
  }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const hasCategories = categories.length > 0;
  const currencySymbol = getCurrencySymbol(currency);

  function handleCategoryCreated(category: { id: string; name: string }) {
    setCategories((current) =>
      [...current, category].sort((a, b) => a.name.localeCompare(b.name)),
    );
    updateField("categoryId", category.id);
    categoryTriggerRef.current?.focus();
  }

  function updateField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!(field in current)) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function focusField(field: keyof FormValues) {
    if (field === "amount") {
      amountInputRef.current?.focus();
    } else if (field === "categoryId") {
      categoryTriggerRef.current?.focus();
    } else if (field === "date") {
      dateInputRef.current?.focus();
    }
  }

  function applyFieldErrors(errors: FieldErrors) {
    setFieldErrors(errors);
    const firstField = FIELD_ORDER.find((field) => field in errors);
    if (firstField) {
      focusField(firstField);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const clientResult = createExpenseSchema.safeParse(values);

    if (!clientResult.success) {
      const errors: FieldErrors = {};
      for (const issue of clientResult.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !(field in errors)) {
          errors[field as keyof FormValues] = issue.message;
        }
      }
      applyFieldErrors(errors);
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.status === 201) {
        const { data } = await response.json();
        setValues((current) => ({ ...current, amount: "", description: "" }));
        setFieldErrors({});
        setSuccessMessage(
          `Added ${formatMoney(data.amountMinor, data.currency)} to ${data.categoryName}.`,
        );
        amountInputRef.current?.focus();
        return;
      }

      if (response.status === 401) {
        setFormError("Your session has expired. Please sign in again.");
        router.push("/login");
        return;
      }

      const payload = await response.json().catch(() => null);
      const fields = payload?.error?.fields as
        Record<string, string> | undefined;

      if (fields && Object.keys(fields).length > 0) {
        applyFieldErrors(fields as FieldErrors);
        return;
      }

      setFormError(
        typeof payload?.error?.message === "string"
          ? payload.error.message
          : GENERIC_ERROR_MESSAGE,
      );
    } catch {
      setFormError(GENERIC_ERROR_MESSAGE);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </p>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="flex items-start justify-between gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground"
        >
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            aria-label="Dismiss"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="amount">Amount</Label>
            <span className="text-xs text-muted-foreground">Required</span>
          </div>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground"
            >
              {currencySymbol}
            </span>
            <Input
              ref={amountInputRef}
              id="amount"
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              className="pl-6"
              value={values.amount}
              onChange={(event) => updateField("amount", event.target.value)}
              aria-invalid={Boolean(fieldErrors.amount)}
              aria-describedby={fieldErrors.amount ? "amount-error" : undefined}
              required
            />
          </div>
          {fieldErrors.amount ? (
            <p id="amount-error" className="text-sm text-destructive">
              {fieldErrors.amount}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="date">Date</Label>
            <span className="text-xs text-muted-foreground">Required</span>
          </div>
          <Input
            ref={dateInputRef}
            id="date"
            name="date"
            type="date"
            value={values.date}
            onChange={(event) => updateField("date", event.target.value)}
            aria-invalid={Boolean(fieldErrors.date)}
            aria-describedby={fieldErrors.date ? "date-error" : undefined}
            required
          />
          {fieldErrors.date ? (
            <p id="date-error" className="text-sm text-destructive">
              {fieldErrors.date}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="category">Category</Label>
          <span className="text-xs text-muted-foreground">Required</span>
        </div>
        <CreateCategoryControl onCreated={handleCategoryCreated} />
        {hasCategories ? (
          <Select
            value={values.categoryId}
            onValueChange={(value) => updateField("categoryId", value ?? "")}
          >
            <SelectTrigger
              ref={categoryTriggerRef}
              id="category"
              className="w-full"
              aria-invalid={Boolean(fieldErrors.categoryId)}
              aria-describedby={
                fieldErrors.categoryId ? "category-error" : undefined
              }
            >
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            No categories yet — create one above to get started.
          </p>
        )}
        {fieldErrors.categoryId ? (
          <p id="category-error" className="text-sm text-destructive">
            {fieldErrors.categoryId}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Description</Label>
          <span className="text-xs text-muted-foreground">Optional</span>
        </div>
        <Input
          id="description"
          name="description"
          maxLength={200}
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={
            fieldErrors.description ? "description-error" : undefined
          }
        />
        {fieldErrors.description ? (
          <p id="description-error" className="text-sm text-destructive">
            {fieldErrors.description}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isPending || !hasCategories}
        aria-busy={isPending}
        aria-disabled={isPending || !hasCategories}
      >
        {isPending ? (
          <>
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Adding…
          </>
        ) : (
          "Add expense"
        )}
      </Button>
    </form>
  );
}
