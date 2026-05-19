export default function BulkLoading() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-1.5">
        <div className="h-7 w-44 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-muted/60 animate-pulse" />
      </div>

      {/* Platform selector */}
      <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />

      {/* Upload area */}
      <div className="rounded-xl border-2 border-dashed border-border bg-card p-12 flex flex-col items-center gap-3">
        <div className="size-10 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
        <div className="h-3 w-36 rounded bg-muted/60 animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border p-3 flex gap-4">
          {[120, 200, 80].map((w, i) => (
            <div key={i} className="h-3 rounded bg-muted animate-pulse" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b border-border last:border-0 p-3 flex gap-4">
            {[100, 180, 70].map((w, j) => (
              <div key={j} className="h-3 rounded bg-muted/50 animate-pulse" style={{ width: w - i * 10 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
