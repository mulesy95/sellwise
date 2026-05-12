import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Audit — Sellwise" };

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <BarChart3 className="size-5 text-primary" />
          Listing Audit
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Score your listing 0–100 with a breakdown by title, tags, and
          description.
        </p>
      </div>
      <Card className="flex min-h-64 items-center justify-center border-border/30 border-dashed">
        <CardContent className="text-center">
          <BarChart3 className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">Coming in Week 2</p>
          <p className="text-xs text-muted-foreground">
            Listing audit tool is under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
