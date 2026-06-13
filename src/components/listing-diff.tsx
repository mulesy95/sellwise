// src/components/listing-diff.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ChangeNote {
  field: string;
  reason: string;
}

interface TabConfig {
  id: string;
  label: string;
  fieldKey: string;
  content: string | string[];
  isTags?: boolean;
  isBullets?: boolean;
}

interface ListingDiffProps {
  tabs: TabConfig[];
  original: Record<string, string | string[]>;
  changes: ChangeNote[];
}

function renderValue(value: string | string[], isList: boolean): string {
  if (Array.isArray(value)) return value.join(isList ? ", " : "\n");
  return value;
}

export function ListingDiff({ tabs, original, changes }: ListingDiffProps) {
  const changedFieldKeys = new Set(changes.map((c) => c.field));

  const diffTabs = tabs.filter((tab) => {
    const orig = original[tab.fieldKey];
    return orig !== undefined && orig !== "" && (Array.isArray(orig) ? orig.length > 0 : true);
  });

  if (diffTabs.length === 0 && changes.length === 0) return null;

  return (
    <div className="space-y-4 rounded-lg border border-border/50 bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        What changed
      </p>

      {diffTabs.map((tab) => {
        const orig = original[tab.fieldKey];
        const isList = tab.isTags ?? tab.isBullets ?? false;
        const origText = renderValue(orig, isList);
        const newText = renderValue(tab.content, isList);
        if (origText === newText) return null;

        return (
          <div key={tab.id} className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {tab.label}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-destructive/5 border border-destructive/20 p-2">
                <p className="text-[10px] font-medium text-destructive/70 mb-1">Before</p>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">
                  {origText}
                </p>
              </div>
              <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 p-2">
                <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mb-1">After</p>
                <p className="text-xs leading-relaxed line-clamp-4 whitespace-pre-wrap">
                  {newText}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {changes.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Why these changes
            </p>
            <ul className="space-y-1.5">
              {changes.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="mt-0.5 shrink-0 h-4 rounded px-1 py-0 text-[9px]">
                    {c.field}
                  </Badge>
                  <span className="leading-relaxed">{c.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
