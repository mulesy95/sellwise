export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1.5">
        <div className="h-7 w-28 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-56 rounded-md bg-muted/60 animate-pulse" />
      </div>

      {/* Plan card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-20 rounded bg-muted animate-pulse" />
            <div className="h-3 w-40 rounded bg-muted/60 animate-pulse" />
          </div>
          <div className="h-8 w-28 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
      </div>

      {/* Upgrade grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            <div className="h-6 w-20 rounded bg-muted animate-pulse" />
            <div className="h-3 w-28 rounded bg-muted/60 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Account section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="h-4 w-20 rounded bg-muted animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-1">
            <div className="h-3 w-24 rounded bg-muted/60 animate-pulse" />
            <div className="h-3 rounded bg-muted animate-pulse" style={{ width: 80 + i * 20 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
