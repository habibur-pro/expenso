/**
 * Skeleton for `/dashboard` shown while the summary query is in flight.
 * Mirrors the real page's structure (page header, 4 stat cards, 2 panels)
 * so swapping in the real content causes no layout shift.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded bg-muted" />
          <div className="h-4 w-48 rounded bg-muted" />
        </div>
        <div className="h-8 w-full rounded-lg bg-muted sm:w-32" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 rounded-lg border border-border bg-card p-4"
          >
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="mt-3 h-7 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-56 rounded-lg border border-border bg-card p-4 sm:p-5"
          >
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="mt-4 space-y-3">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
