"use client";

import { useState } from "react";
import { Copy, Check, Sparkles, AlertCircle, ArrowLeftRight } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/upgrade-modal";
import { PlatformSelector } from "@/components/platform-selector";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS, type Platform } from "@/lib/platforms";

// ─── Source field configs ─────────────────────────────────────────────────────

interface FieldConfig {
  name: string;
  label: string;
  type: "input" | "textarea";
  placeholder: string;
  hint?: string;
}

const SOURCE_FIELDS: Record<Platform, FieldConfig[]> = {
  etsy: [
    { name: "title", label: "Title", type: "input", placeholder: "Your Etsy listing title" },
    { name: "tags", label: "Tags", type: "input", placeholder: "Comma-separated tags" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Your listing description" },
  ],
  amazon: [
    { name: "title", label: "Title", type: "input", placeholder: "Your Amazon product title" },
    { name: "bullets", label: "Bullet Points", type: "textarea", placeholder: "One bullet point per line", hint: "Paste each bullet on its own line" },
    { name: "backendKeywords", label: "Backend Keywords", type: "input", placeholder: "Space-separated search terms (optional)" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Product description (optional)" },
  ],
  shopify: [
    { name: "title", label: "Product Title", type: "input", placeholder: "Your product title" },
    { name: "productCopy", label: "Product Description", type: "textarea", placeholder: "Your product page description" },
  ],
  ebay: [
    { name: "title", label: "Title", type: "input", placeholder: "Your eBay listing title" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Your item description" },
  ],
};

// ─── Result field configs ─────────────────────────────────────────────────────

interface ResultField {
  key: string;
  label: string;
  type: "text" | "tags" | "bullets" | "longtext";
}

const RESULT_FIELDS: Record<Platform, ResultField[]> = {
  etsy: [
    { key: "title", label: "Title", type: "text" },
    { key: "tags", label: "Tags", type: "tags" },
    { key: "description", label: "Description", type: "longtext" },
  ],
  amazon: [
    { key: "title", label: "Title", type: "text" },
    { key: "bullets", label: "Bullet Points", type: "bullets" },
    { key: "backendKeywords", label: "Backend Keywords", type: "text" },
    { key: "description", label: "Description", type: "longtext" },
  ],
  shopify: [
    { key: "metaTitle", label: "Meta Title", type: "text" },
    { key: "metaDescription", label: "Meta Description", type: "text" },
    { key: "productTitle", label: "Product Title", type: "text" },
    { key: "description", label: "Description", type: "longtext" },
  ],
  ebay: [
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "longtext" },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

interface MigrateResult {
  targetPlatform: Platform;
  result: Record<string, unknown>;
  used: number;
  limit: number | null;
}

export function MigrateClient() {
  const [source, setSource] = useState<Platform>("etsy");
  const [target, setTarget] = useState<Platform>("amazon");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  function handleSourceChange(p: Platform) {
    setSource(p);
    if (p === target) {
      // Pick any other platform as target
      const others = (["etsy", "amazon", "shopify", "ebay"] as Platform[]).filter((x) => x !== p);
      setTarget(others[0]);
    }
    setResult(null);
    setError(null);
  }

  function handleTargetChange(p: Platform) {
    setTarget(p);
    setResult(null);
    setError(null);
  }

  function swap() {
    setSource(target);
    setTarget(source);
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload: Record<string, string> = { sourcePlatform: source, targetPlatform: target };

    for (const field of SOURCE_FIELDS[source]) {
      const el = form.elements.namedItem(field.name);
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        payload[field.name] = el.value;
      }
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) { setUpgradeOpen(true); return; }
        setError(data.error ?? "Something went wrong");
        return;
      }

      setResult(data as MigrateResult);
    } catch {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied");
    setTimeout(() => setCopied(null), 2000);
  }

  function stringValue(v: unknown): string {
    if (typeof v === "string") return v;
    return "";
  }

  function arrayValue(v: unknown): string[] {
    if (Array.isArray(v)) return v.map(String);
    return [];
  }

  return (
    <div className="space-y-6">
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ArrowLeftRight className="size-5 text-primary" />
          Platform Migration
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste your existing listing and the AI will reformat it for a different platform — titles, tags, bullets, and all.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">From</p>
                <PlatformSelector value={source} onChange={handleSourceChange} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-border/50" />
                <button
                  type="button"
                  onClick={swap}
                  title="Swap platforms"
                  className="flex items-center gap-1 rounded-full border border-border/50 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <ArrowLeftRight className="size-3" />
                  swap
                </button>
                <div className="flex-1 border-t border-border/50" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">To</p>
                <PlatformSelector
                  value={target}
                  onChange={handleTargetChange}
                  exclude={[source]}
                />
              </div>
            </div>
            <CardDescription className="text-xs mt-3">
              Paste your {PLATFORM_LABELS[source]} listing below — any combination of fields works.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {SOURCE_FIELDS[source].map((field) => (
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
                    <Input id={field.name} name={field.name} placeholder={field.placeholder} />
                  )}
                  {field.hint && (
                    <p className="text-[11px] text-muted-foreground">{field.hint}</p>
                  )}
                </div>
              ))}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <span className="mr-2 inline-block size-3.5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                    Migrating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    Migrate to {PLATFORM_LABELS[target]}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Output */}
        <div className="space-y-4">
          {error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="flex items-start gap-3 py-4">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Migration failed</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-xs text-muted-foreground hover:text-foreground">
                  Dismiss
                </button>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="flex min-h-64 items-center justify-center border-border/30">
              <CardContent className="text-center">
                <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                <p className="text-sm text-muted-foreground">Reformatting for {PLATFORM_LABELS[target]}…</p>
              </CardContent>
            </Card>
          )}

          {!result && !loading && !error && (
            <Card className="flex min-h-64 items-center justify-center border-border/30 border-dashed">
              <CardContent className="text-center">
                <ArrowLeftRight className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Your {PLATFORM_LABELS[target]}-ready listing will appear here.
                </p>
              </CardContent>
            </Card>
          )}

          {result && !loading && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-primary">
                  {PLATFORM_LABELS[result.targetPlatform]} listing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {RESULT_FIELDS[result.targetPlatform].map((field, idx) => {
                  const value = result.result[field.key];
                  if (!value) return null;

                  return (
                    <div key={field.key}>
                      {idx > 0 && <Separator className="mb-4" />}

                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          {field.label}
                          {field.type === "tags" && Array.isArray(value) && (
                            <span className="ml-1">({value.length})</span>
                          )}
                          {field.type === "bullets" && Array.isArray(value) && (
                            <span className="ml-1">({value.length})</span>
                          )}
                        </p>
                        <button
                          onClick={() => {
                            const text =
                              field.type === "tags" || field.type === "bullets"
                                ? arrayValue(value).join(field.type === "tags" ? ", " : "\n")
                                : stringValue(value);
                            copy(text, field.key);
                          }}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copied === field.key ? (
                            <Check className="size-3 text-green-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>

                      {field.type === "tags" && (
                        <div className="flex flex-wrap gap-1">
                          {arrayValue(value).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {field.type === "bullets" && (
                        <ol className="list-decimal list-inside space-y-1.5">
                          {arrayValue(value).map((b, i) => (
                            <li key={i} className="text-sm leading-relaxed">
                              {b}
                            </li>
                          ))}
                        </ol>
                      )}

                      {(field.type === "text" || field.type === "longtext") && (
                        <>
                          <p className="text-sm leading-relaxed">{stringValue(value)}</p>
                          {field.type === "text" && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {stringValue(value).length} chars
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
