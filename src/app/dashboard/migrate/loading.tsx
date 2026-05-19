export default function MigrateLoading() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-1.5">
        <div className="h-7 w-48 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-muted/60 animate-pulse" />
      </div>

      {/* Platform selectors */}
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="h-6 w-6 rounded bg-muted animate-pulse mt-5 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      {/* Input textarea */}
      <div className="space-y-1.5">
        <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
        <div className="h-40 w-full rounded-lg bg-muted animate-pulse" />
      </div>

      <div className="h-10 w-36 rounded-lg bg-muted animate-pulse" />
    </div>
  );
}
