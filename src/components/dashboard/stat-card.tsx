import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  meta?: ReactNode;
};

/**
 * One labelled statistic on the dashboard overview — a muted label, a
 * large value, and an optional line of supporting context (e.g. the
 * month-over-month change). Presentational only; plain Tailwind on the
 * existing card tokens rather than a new shadcn primitive.
 */
export function StatCard({ label, value, meta }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      {meta ? (
        <div className="mt-1.5 text-sm text-muted-foreground">{meta}</div>
      ) : null}
    </div>
  );
}
