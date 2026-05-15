"use client";

import { useState } from "react";
import { BarChart3, Sparkles, AlertCircle } from "lucide-react";
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
import { PlatformSelector } from "@/components/platform-selector";
import { cn } from "@/lib/utils";
import { AUDIT_SECTIONS, type Platform } from "@/lib/platforms";

interface AuditResult {
  score: number;
  improvements: string[];
  [key: string]: number | string | string[];
}

interface FieldConfig {
  name: string;
  label: string;
  type: "input" | "textarea";
  placeholder: string;
  hint?: string;
}

const FORM_CONFIGS: Record<Platform, FieldConfig[]> = {
  etsy: [
    {
      name: "title",
      label: "Title",
      type: "input",
      placeholder: "Your current Etsy title",
    },
    {
      name: "tags",
      label: "Tags",
      type: "input",
      placeholder: "Comma-separated, e.g. ceramic mug, coffee lover gift",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Your listing description",
    },
  ],
  amazon: [
    {
      name: "title",
      label: "Title",
      type: "input",
      placeholder: "Your Amazon product title",
    },
    {
      name: "bullets",
      label: "Bullet Points",
      type: "textarea",
      placeholder: "One bullet point per line",
      hint: "Paste each bullet on its own line",
    },
    {
      name: "backendKeywords",
      label: "Backend Keywords",
      type: "input",
      placeholder: "Space-separated backend search terms",
    },
    {
      name: "description",
      label: "Description (optional)",
      type: "textarea",
      placeholder: "Your product description",
    },
  ],
  shopify: [
    {
      name: "metaTitle",
      label: "Meta Title",
      type: "input",
      placeholder: "Your page meta title (max 60 chars)",
    },
    {
      name: "metaDescription",
      label: "Meta Description",
      type: "input",
      placeholder: "Your meta description (max 160 chars)",
    },
    {
      name: "productCopy",
      label: "Product Description",
      type: "textarea",
      placeholder: "Your product page description",
    },
  ],
  ebay: [
    {
      name: "title",
      label: "Title",
      type: "input",
      placeholder: "Your eBay listing title (max 80 chars)",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Your item description",
    },
  ],
};

const PLATFORM_DESCRIPTIONS: Record<Platform, string> = {
  etsy: "Score your Etsy listing 0–100 with a breakdown by title, tags, and description.",
  amazon: "Score your Amazon listing 0–100 across title, bullet points, and backend keywords.",
  shopify: "Score your Shopify product 0–100 across meta title, meta description, and product copy.",
  ebay: "Score your eBay listing 0–100 across title and item description.",
};

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

export function AuditClient() {
  const [platform, setPlatform] = useState<Platform>("etsy");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  function handlePlatformChange(p: Platform) {
    setPlatform(p);
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fields = FORM_CONFIGS[platform];

    const payload: Record<string, string> = { platform };
    for (const field of fields) {
      const el = form.elements.namedItem(field.name);
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        payload[field.name] = el.value;
      }
    }

    const hasContent = fields.some((f) => payload[f.name]?.trim());
    if (!hasContent) {
      toast.error("Enter at least one field to audit");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      setError(err instanceof Error ? err.message : "Failed to run audit");
    } finally {
      setLoading(false);
    }
  }

  const sections = AUDIT_SECTIONS[platform];

  return (
    <div className="space-y-6">
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <BarChart3 className="size-5 text-primary" />
          Listing Audit
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {PLATFORM_DESCRIPTIONS[platform]}
        </p>
      </div>

      <PlatformSelector value={platform} onChange={handlePlatformChange} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Your listing</CardTitle>
            <CardDescription className="text-xs">
              Paste your existing content — any combination of fields works.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {FORM_CONFIGS[platform].map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      rows={4}
                      placeholder={field.placeholder}
                      className={cn(
                        "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs",
                        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        "disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      )}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder={field.placeholder}
                    />
                  )}
                  {field.hint && (
                    <p className="text-[11px] text-muted-foreground">
                      {field.hint}
                    </p>
                  )}
                </div>
              ))}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <span className="mr-2 inline-block size-3.5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
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

        <div className="space-y-4">
          {!result && !loading && error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="flex items-start gap-3 py-4">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Audit failed</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
              </CardContent>
            </Card>
          )}

          {!result && !loading && !error && (
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
                <p className="text-sm text-muted-foreground">
                  Analysing your listing…
                </p>
              </CardContent>
            </Card>
          )}

          {result && (
            <div className="space-y-4">
              <Card className="border-border/50">
                <CardContent className="flex items-center gap-6 py-6">
                  <div className="text-center">
                    <div
                      className={cn(
                        "text-5xl font-bold tabular-nums",
                        overallColour(result.score)
                      )}
                    >
                      {result.score}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      out of 100
                    </div>
                  </div>
                  <div className="flex-1">
                    <div
                      className={cn(
                        "text-lg font-semibold mb-1",
                        overallColour(result.score)
                      )}
                    >
                      {overallLabel(result.score)}
                    </div>
                    <Progress value={result.score} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sections.map(({ key, label, max }) => {
                    const score = (result[key] as number) ?? 0;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium">{label}</span>
                          <span
                            className={cn(
                              "text-xs font-semibold tabular-nums",
                              scoreColour(score, max)
                            )}
                          >
                            {score} / {max}
                          </span>
                        </div>
                        <Progress
                          value={(score / max) * 100}
                          className="h-1.5"
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {result.improvements?.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Quick wins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(result.improvements as string[]).map((imp, i) => (
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
