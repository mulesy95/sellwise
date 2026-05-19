export default function ShopLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="h-7 w-28 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded-md bg-muted/60 animate-pulse" />
      </div>

      {/* Platform tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        <div className="h-8 w-24 rounded-md bg-muted animate-pulse" />
        <div className="h-8 w-20 rounded-md bg-muted animate-pulse" />
      </div>

      {/* Connect button area */}
      <div className="h-10 w-40 rounded-lg bg-muted animate-pulse" />

      {/* Product list */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="size-12 rounded-md bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 rounded bg-muted animate-pulse" style={{ width: `${40 + (i % 3) * 15}%` }} />
              <div className="h-3 w-24 rounded bg-muted/60 animate-pulse" />
            </div>
            <div className="h-8 w-20 rounded-lg bg-muted animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
