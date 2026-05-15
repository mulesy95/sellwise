export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Page title skeleton */}
      <div className="space-y-1.5">
        <div className="h-7 w-40 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded-md bg-muted/60 animate-pulse" />
      </div>

      {/* Card skeletons */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-8 w-32 rounded bg-muted animate-pulse" />
            <div className="h-3 w-48 rounded bg-muted/60 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Content block skeleton */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 rounded bg-muted/50 animate-pulse" style={{ width: `${75 + (i % 3) * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
