"use client";

import { cn } from "@/lib/utils";
import { PLATFORMS, PLATFORM_LABELS, PLATFORM_CAPABILITY, type Platform } from "@/lib/platforms";

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
    <div className="flex flex-wrap rounded-lg border border-border/50 bg-muted p-1 gap-1">
      {platforms.map((p) => {
        const capability = PLATFORM_CAPABILITY[p];
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
              value === p
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {PLATFORM_LABELS[p]}
            {capability === "connect" && (
              <span className="rounded px-1 py-px text-[9px] font-semibold leading-none bg-primary/15 text-primary">
                Connect
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
