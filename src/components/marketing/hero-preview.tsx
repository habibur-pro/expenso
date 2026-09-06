import { CountUp } from "./motion/count-up";
import { RevealGroup, RevealItem } from "./motion/reveal";
import { SpringBar } from "./motion/spring-bar";

const STATS = [
  {
    label: "This month",
    value: 1284.5,
    prefix: "$",
    decimals: 2,
    live: true,
  },
  { label: "Categories", value: 6, prefix: "", decimals: 0, live: false },
  { label: "Avg / day", value: 42.82, prefix: "$", decimals: 2, live: false },
] as const;

const EXPENSE_ROWS = [
  {
    label: "Coffee shop",
    category: "Food & Drink",
    amount: "$4.75",
    dot: "bg-chart-3",
  },
  {
    label: "Grocery run",
    category: "Groceries",
    amount: "$58.20",
    dot: "bg-chart-1",
  },
  {
    label: "Internet bill",
    category: "Utilities",
    amount: "$65.00",
    dot: "bg-chart-2",
  },
  {
    label: "Gym membership",
    category: "Health",
    amount: "$30.00",
    dot: "bg-chart-5",
  },
] as const;

const CATEGORY_BARS = [
  { label: "Groceries", fraction: 0.62, fill: "bg-chart-1" },
  { label: "Utilities", fraction: 0.41, fill: "bg-chart-2" },
  { label: "Food & Drink", fraction: 0.33, fill: "bg-chart-3" },
  { label: "Health", fraction: 0.24, fill: "bg-chart-5" },
] as const;

export function HeroPreview() {
  return (
    <div
      aria-hidden="true"
      className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-2xl shadow-primary/10 backdrop-blur-sm sm:p-6"
    >
      <RevealGroup
        className="grid grid-cols-3 gap-4 border-b border-border pb-6"
        gap={0.12}
      >
        {STATS.map((stat) => (
          <RevealItem key={stat.label}>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {stat.live ? (
                <span className="relative flex size-1.5 shrink-0">
                  <span className="absolute inline-flex size-full rounded-full bg-chart-5 motion-safe:animate-pulse-ring" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-chart-5" />
                </span>
              ) : null}
              {stat.label}
            </p>
            <CountUp
              value={stat.value}
              prefix={stat.prefix}
              decimals={stat.decimals}
              className="font-heading text-xl font-semibold tracking-tight text-foreground tabular-nums sm:text-2xl"
            />
          </RevealItem>
        ))}
      </RevealGroup>

      <RevealGroup
        as="ul"
        className="flex flex-col gap-3.5 border-b border-border py-6"
      >
        {EXPENSE_ROWS.map((row) => (
          <RevealItem
            key={row.label}
            as="li"
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-3">
              <span className={`size-2 shrink-0 rounded-full ${row.dot}`} />
              <div>
                <p className="font-medium text-foreground">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.category}</p>
              </div>
            </div>
            <p className="font-medium text-foreground tabular-nums">
              {row.amount}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>

      <div className="flex flex-col gap-2.5 pt-6">
        {CATEGORY_BARS.map((bar, index) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-muted-foreground">
              {bar.label}
            </span>
            <SpringBar fraction={bar.fraction} fill={bar.fill} index={index} />
          </div>
        ))}
      </div>
    </div>
  );
}
