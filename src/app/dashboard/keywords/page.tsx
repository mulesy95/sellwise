import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Keywords — Sellwise" };

export default function KeywordsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Search className="size-5 text-primary" />
          Keyword Research
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover 15 marketplace keywords with volume and competition scores.
        </p>
      </div>
      <Card className="flex min-h-64 items-center justify-center border-border/30 border-dashed">
        <CardContent className="text-center">
          <Search className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">Coming in Week 2</p>
          <p className="text-xs text-muted-foreground">
            Keyword research tool is under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
