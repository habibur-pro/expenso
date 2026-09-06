"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/expenses/expense-form";

type AddExpenseDialogProps = {
  categories: { id: string; name: string }[];
  currency: string;
};

/**
 * The dashboard's entry point for recording an expense: a trigger button
 * that opens `ExpenseForm` in a modal rather than navigating to a separate
 * page. Uncontrolled (no `open` state here) — the dialog's own trigger,
 * backdrop, close button, and Escape key handle opening and closing, and
 * closing unmounts the form so each open starts from a clean state.
 */
export function AddExpenseDialog({
  categories,
  currency,
}: AddExpenseDialogProps) {
  return (
    <Dialog>
      <DialogTrigger render={<Button>Add expense</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
          <DialogDescription>
            Record a new expense in your history.
          </DialogDescription>
        </DialogHeader>
        <ExpenseForm categories={categories} currency={currency} />
      </DialogContent>
    </Dialog>
  );
}
