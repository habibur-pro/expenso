const EXPENSE_ROWS = [
  { label: "Coffee shop", category: "Food & Drink", amount: "$4.75" },
  { label: "Grocery run", category: "Groceries", amount: "$58.20" },
  { label: "Internet bill", category: "Utilities", amount: "$65.00" },
  { label: "Gym membership", category: "Health", amount: "$30.00" },
] as const;

const CATEGORY_BARS = [
  { label: "Groceries", width: "w-[62%]" },
  { label: "Utilities", width: "w-[41%]" },
  { label: "Food & Drink", width: "w-[33%]" },
  { label: "Health", width: "w-[24%]" },
] as const;

export function HeroPreview() {
  return (
    <div
      aria-hidden="true"
      className="rounded-3xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="grid grid-cols-3 gap-4 border-b border-border pb-6">
        <div>
          <p className="text-xs text-muted-foreground">This month</p>
          <p className="text-xl font-semibold text-foreground">$1,284.50</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Categories</p>
          <p className="text-xl font-semibold text-foreground">6</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avg / day</p>
          <p className="text-xl font-semibold text-foreground">$42.82</p>
        </div>
      </div>

      <ul className="flex flex-col gap-3 border-b border-border py-6">
        {EXPENSE_ROWS.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between text-sm"
          >
            <div>
              <p className="font-medium text-foreground">{row.label}</p>
              <p className="text-xs text-muted-foreground">{row.category}</p>
            </div>
            <p className="font-medium text-foreground">{row.amount}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 pt-6">
        {CATEGORY_BARS.map((bar) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-muted-foreground">
              {bar.label}
            </span>
            <div className="h-2 w-full rounded-full bg-muted">
              <div className={`h-2 rounded-full bg-primary ${bar.width}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
