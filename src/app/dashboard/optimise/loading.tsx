export default function OptimiseLoading() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-1.5">
        <div className="h-7 w-44 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-muted/60 animate-pulse" />
      </div>

      {/* Platform selector */}
      <div className="flex gap-2 flex-wrap">
        {[80, 72, 76, 60, 84].map((w, i) => (
          <div key={i} className="h-8 rounded-full bg-muted animate-pulse" style={{ width: w }} />
        ))}
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {[["Product name", "100%"], ["Materials / techniques", "100%"], ["Style / aesthetic", "60%"], ["Target buyer", "60%"], ["Keywords", "80%"]].map(([, w], i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3.5 w-28 rounded bg-muted animate-pulse" />
            <div className="h-10 rounded-lg bg-muted animate-pulse" style={{ width: w }} />
          </div>
        ))}
      </div>

      <div className="h-10 w-40 rounded-lg bg-muted animate-pulse" />
    </div>
  );
}
