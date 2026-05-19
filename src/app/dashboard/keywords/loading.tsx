export default function KeywordsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="h-7 w-44 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded-md bg-muted/60 animate-pulse" />
      </div>

      {/* Search form */}
      <div className="flex gap-3">
        <div className="h-10 flex-1 rounded-lg bg-muted animate-pulse" />
        <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
        <div className="h-10 w-28 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* Keyword cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="h-4 rounded bg-muted animate-pulse" style={{ width: `${50 + (i % 4) * 12}%` }} />
            <div className="flex gap-2">
              <div className="h-3 w-16 rounded bg-muted/60 animate-pulse" />
              <div className="h-3 w-14 rounded bg-muted/60 animate-pulse" />
              <div className="h-3 w-12 rounded bg-muted/60 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
