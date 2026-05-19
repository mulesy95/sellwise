export default function HistoryLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="h-7 w-36 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-56 rounded-md bg-muted/60 animate-pulse" />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {[64, 56, 72, 60, 68].map((w, i) => (
          <div key={i} className="h-7 rounded-full bg-muted animate-pulse" style={{ width: w }} />
        ))}
      </div>

      {/* History items */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
                <div className="h-4 rounded bg-muted animate-pulse" style={{ width: 120 + (i % 3) * 30 }} />
              </div>
              <div className="h-3 w-20 rounded bg-muted/60 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-muted/50 animate-pulse" />
              <div className="h-3 rounded bg-muted/50 animate-pulse" style={{ width: "75%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
