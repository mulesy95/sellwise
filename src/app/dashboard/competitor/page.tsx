import { Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Competitor — EtsyAI" };

export default function CompetitorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Eye className="size-5 text-primary" />
          Competitor Peek
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste any Etsy listing URL to extract their SEO strategy.
        </p>
      </div>
      <Card className="flex min-h-64 items-center justify-center border-border/30 border-dashed">
        <CardContent className="text-center">
          <Eye className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">Coming in Week 2</p>
          <p className="text-xs text-muted-foreground">
            Competitor analysis tool is under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
