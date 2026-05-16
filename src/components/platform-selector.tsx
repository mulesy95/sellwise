"use client";

import { cn } from "@/lib/utils";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/platforms";

export function PlatformSelector({
  value,
  onChange,
  exclude = [],
}: {
  value: Platform;
  onChange: (p: Platform) => void;
  exclude?: Platform[];
}) {
  const platforms = PLATFORMS.filter((p) => !exclude.includes(p));
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted p-1 gap-0.5">
      {platforms.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            value === p
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {PLATFORM_LABELS[p]}
        </button>
      ))}
    </div>
  );
}
