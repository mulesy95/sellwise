export default function AuditLoading() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-1.5">
        <div className="h-7 w-36 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-muted/60 animate-pulse" />
      </div>

      {/* Platform + mode tabs */}
      <div className="flex gap-2">
        <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
        <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* Input area */}
      <div className="space-y-3">
        <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
        <div className="h-28 w-full rounded-lg bg-muted animate-pulse" />
        <div className="h-10 w-36 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* Score area */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-24 rounded bg-muted animate-pulse" />
            <div className="h-3 w-40 rounded bg-muted/60 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-muted/50 animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
