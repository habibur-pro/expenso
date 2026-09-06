"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategorySchema } from "@/lib/validations/category";

type CreateCategoryControlProps = {
  onCreated: (category: { id: string; name: string }) => void;
};

const GENERIC_ERROR_MESSAGE =
  "We couldn't create that category. Please try again.";

/**
 * A collapsed "+ New category" toggle that expands into an inline
 * name field + create action, for creating a category without leaving
 * the add-expense modal. Renders as a plain `<div>`, not a `<form>` —
 * it lives inside `ExpenseForm`'s own `<form>`, and HTML disallows
 * nested forms.
 */
export function CreateCategoryControl({
  onCreated,
}: CreateCategoryControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function open() {
    setIsOpen(true);
    setError(null);
    setName("");
  }

  function close() {
    setIsOpen(false);
    setError(null);
    setName("");
  }

  async function submit() {
    setError(null);

    const result = createCategorySchema.safeParse({ name });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? GENERIC_ERROR_MESSAGE);
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: result.data.name }),
      });

      if (response.status === 201) {
        const { data } = await response.json();
        onCreated(data);
        close();
        return;
      }

      const payload = await response.json().catch(() => null);
      setError(
        typeof payload?.error?.message === "string"
          ? payload.error.message
          : GENERIC_ERROR_MESSAGE,
      );
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setIsPending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Plus aria-hidden="true" className="size-3.5" />
        New category
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Category name"
          maxLength={50}
          aria-label="New category name"
          aria-invalid={Boolean(error)}
          disabled={isPending}
          className="h-7 text-sm"
        />
        <Button
          type="button"
          size="icon-sm"
          onClick={() => void submit()}
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? (
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          ) : (
            <Plus aria-hidden="true" className="size-3.5" />
          )}
          <span className="sr-only">Add category</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={close}
          disabled={isPending}
        >
          <X aria-hidden="true" className="size-3.5" />
          <span className="sr-only">Cancel</span>
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
