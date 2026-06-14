import { Trophy } from "lucide-react";

const MILESTONES = [
  { count: 10, label: "Veteran" },
  { count: 50, label: "Pro Seller" },
  { count: 100, label: "Power User" },
  { count: 250, label: "Elite Seller" },
];

interface MilestoneWidgetProps {
  optimisationCount: number;
}

export function MilestoneWidget({ optimisationCount }: MilestoneWidgetProps) {
  const next = MILESTONES.find((m) => m.count > optimisationCount);
  if (!next) return null;

  const prev = MILESTONES.filter((m) => m.count <= optimisationCount).at(-1);
  const base = prev?.count ?? 0;
  const progress = optimisationCount - base;
  const target = next.count - base;
  const pct = Math.round((progress / target) * 100);
  const remaining = next.count - optimisationCount;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Trophy className="size-3.5 text-amber-500 shrink-0" />
        <p className="text-xs font-medium">
          {remaining} optimisation{remaining !== 1 ? "s" : ""} to {next.label}
        </p>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
