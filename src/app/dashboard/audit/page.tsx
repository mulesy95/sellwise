"use client";

import { useState } from "react";
import { BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/upgrade-modal";
import { cn } from "@/lib/utils";

interface AuditResult {
  score: number;
  titleScore: number;
  tagsScore: number;
  descriptionScore: number;
  improvements: string[];
}

function scoreColour(score: number, max: number) {
  const pct = (score / max) * 100;
  if (pct >= 70) return "text-green-500";
  if (pct >= 40) return "text-amber-500";
  return "text-red-400";
}

function overallColour(score: number) {
  if (score >= 70) return "text-green-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-400";
}

function overallLabel(score: number) {
  if (score >= 70) return "Good";
  if (score >= 40) return "Needs work";
  return "Poor";
}

export default function AuditPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const tags = (form.elements.namedItem("tags") as HTMLInputElement).value;
    const description = (form.elements.namedItem("description") as HTMLTextAreaElement).value;

    if (!title && !tags && !description) {
      toast.error("Enter at least one of title, tags, or description");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, tags, description }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 402) {
          setUpgradeOpen(true);
          return;
        }
        throw new Error(err.error ?? "Something went wrong");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to run audit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <BarChart3 className="size-5 text-primary" />
          Listing Audit
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Score your listing 0–100 with a breakdown by title, tags, and description.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input form */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Your listing</CardTitle>
            <CardDescription className="text-xs">
              Paste your existing content — any combination of fields works.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Your current listing title"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="Comma-separated, e.g. ceramic mug, coffee lover gift"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  placeholder="Your listing description"
                  className={cn(
                    "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs",
                    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  )}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <span className="mr-2 inline-block size-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Auditing…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    Run audit
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {!result && !loading && (
            <Card className="flex min-h-64 items-center justify-center border-border/30 border-dashed">
              <CardContent className="text-center">
                <BarChart3 className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Your audit results will appear here.
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="flex min-h-64 items-center justify-center border-border/30">
              <CardContent className="text-center">
                <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                <p className="text-sm text-muted-foreground">Analysing your listing…</p>
              </CardContent>
            </Card>
          )}

          {result && (
            <div className="space-y-4">
              {/* Overall score */}
              <Card className="border-border/50">
                <CardContent className="flex items-center gap-6 py-6">
                  <div className="text-center">
                    <div className={cn("text-5xl font-bold tabular-nums", overallColour(result.score))}>
                      {result.score}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">out of 100</div>
                  </div>
                  <div className="flex-1">
                    <div className={cn("text-lg font-semibold mb-1", overallColour(result.score))}>
                      {overallLabel(result.score)}
                    </div>
                    <Progress
                      value={result.score}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Score breakdown */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Title", score: result.titleScore, max: 40 },
                    { label: "Tags", score: result.tagsScore, max: 35 },
                    { label: "Description", score: result.descriptionScore, max: 25 },
                  ].map(({ label, score, max }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium">{label}</span>
                        <span className={cn("text-xs font-semibold tabular-nums", scoreColour(score, max))}>
                          {score} / {max}
                        </span>
                      </div>
                      <Progress value={(score / max) * 100} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Improvements */}
              {result.improvements?.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Quick wins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.improvements.map((imp, i) => (
                        <li key={i} className="flex gap-2.5 text-sm">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
