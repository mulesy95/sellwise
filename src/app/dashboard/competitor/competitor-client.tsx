"use client";

import { useState } from "react";
import { Eye, Copy, Check, AlertCircle } from "lucide-react";
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
import {
  detectPlatformFromUrl,
  PLATFORM_LABELS,
  PLATFORM_URL_EXAMPLES,
  type Platform,
} from "@/lib/platforms";

interface ListingData {
  platform: Platform;
  title: string;
  description: string;
  tags?: string[];
  bullets?: string[];
}

interface Result {
  platform: Platform;
  original: ListingData;
  optimised: ListingData;
  improvements: string[];
}

export function CompetitorClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<Platform | null>(null);

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const detected = detectPlatformFromUrl(e.target.value);
    const unsupported = detected === "etsy" || detected === "amazon" || detected === "ebay";
    setDetectedPlatform(unsupported ? null : detected);
    if (detected === "etsy") {
      setError("Etsy URLs aren't supported. Copy the listing content and use the Listing Audit tool with manual entry.");
    } else if (detected === "amazon") {
      setError("Amazon URL analysis is coming soon via the official SP-API. For now, copy the content and paste it into the Listing Audit tool.");
    } else if (detected === "ebay") {
      setError("eBay URL analysis is coming soon via the official eBay API. For now, copy the content and paste it into the Listing Audit tool.");
    } else {
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const url = (
      e.currentTarget.elements.namedItem("url") as HTMLInputElement
    ).value.trim();

    if (!detectedPlatform) {
      setError(
        "URL not recognised. Paste a Shopify product URL (yourstore.com/products/...). Amazon and eBay support is coming soon."
      );
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setUpgradeOpen(true);
          return;
        }
        setError(data.error ?? "Something went wrong");
        return;
      }

      setResult(data);
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

  const allExamples = Object.values(PLATFORM_URL_EXAMPLES).join(" · ");

  return (
    <div className="space-y-6">
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Eye className="size-5 text-primary" />
          Competitor Peek
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a Shopify listing URL to get an AI-optimised version. Amazon and eBay coming soon.
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Listing URL</CardTitle>
          <CardDescription className="text-xs">
            Supports Amazon, Shopify stores, and eBay.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="url" className="sr-only">
                  Listing URL
                </Label>
                <div className="relative">
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    placeholder="Paste a listing URL…"
                    required
                    onChange={handleUrlChange}
                    className={detectedPlatform ? "pr-24" : ""}
                  />
                  {detectedPlatform && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {PLATFORM_LABELS[detectedPlatform]}
                    </span>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={loading || !detectedPlatform} className="shrink-0">
                {loading ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                ) : (
                  <>
                    <Eye className="size-3.5" />
                    Analyse
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              e.g. {allExamples}
            </p>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <Card className="flex min-h-48 items-center justify-center border-border/30">
          <CardContent className="text-center">
            <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <p className="text-sm text-muted-foreground">
              Fetching and analysing listing…
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex gap-3 py-4">
            <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {result.improvements?.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-primary">
                  What we improved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.improvements.map((imp, i) => (
                    <li key={i} className="flex gap-2 text-xs">
                      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      {imp}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Original */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">
                  Their listing
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                    {PLATFORM_LABELS[result.platform]}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Title
                  </p>
                  <p className="text-sm leading-relaxed">
                    {result.original.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {result.original.title.length} chars
                  </p>
                </div>

                {result.original.tags && result.original.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                        Tags ({result.original.tags.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.original.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {result.original.bullets && result.original.bullets.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                        Bullets ({result.original.bullets.length})
                      </p>
                      <ol className="list-decimal list-inside space-y-1">
                        {result.original.bullets.map((b, i) => (
                          <li key={i} className="text-xs leading-relaxed">
                            {b}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </>
                )}

                {result.original.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Description
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground line-clamp-4">
                        {result.original.description}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Optimised */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-primary">
                  Optimised version
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Title
                    </p>
                    <button
                      onClick={() =>
                        copy(result.optimised.title, "opt-title")
                      }
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === "opt-title" ? (
                        <Check className="size-3 text-green-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {result.optimised.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {result.optimised.title.length} chars
                  </p>
                </div>

                {result.optimised.tags && result.optimised.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          Tags ({result.optimised.tags.length})
                        </p>
                        <button
                          onClick={() =>
                            copy(result.optimised.tags!.join(", "), "opt-tags")
                          }
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copied === "opt-tags" ? (
                            <Check className="size-3 text-green-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {result.optimised.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {result.optimised.bullets &&
                  result.optimised.bullets.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-xs font-medium text-muted-foreground">
                            Bullets ({result.optimised.bullets.length})
                          </p>
                          <button
                            onClick={() =>
                              copy(
                                result.optimised.bullets!.join("\n"),
                                "opt-bullets"
                              )
                            }
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copied === "opt-bullets" ? (
                              <Check className="size-3 text-green-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5">
                          {result.optimised.bullets.map((b, i) => (
                            <li key={i} className="text-xs leading-relaxed">
                              {b}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </>
                  )}

                <Separator />
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Description
                    </p>
                    <button
                      onClick={() =>
                        copy(result.optimised.description, "opt-desc")
                      }
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === "opt-desc" ? (
                        <Check className="size-3 text-green-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {result.optimised.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!loading && !result && !error && (
        <Card className="flex min-h-48 items-center justify-center border-border/30 border-dashed">
          <CardContent className="text-center">
            <Eye className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Paste a listing URL above to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
