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

interface Listing {
  title: string;
  tags: string[];
  description: string;
}

interface Result {
  original: Listing;
  optimised: Listing;
  improvements: string[];
}

export function CompetitorClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const url = (
      e.currentTarget.elements.namedItem("url") as HTMLInputElement
    ).value.trim();

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

  return (
    <div className="space-y-6">
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Eye className="size-5 text-primary" />
          Competitor Peek
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste an Etsy listing URL to extract their SEO and generate a better version.
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Etsy listing URL</CardTitle>
          <CardDescription className="text-xs">
            Paste any Etsy listing URL — e.g. etsy.com/listing/1234567/product-name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="url" className="sr-only">
                Etsy listing URL
              </Label>
              <Input
                id="url"
                name="url"
                type="url"
                placeholder="https://www.etsy.com/listing/..."
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="shrink-0">
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              ) : (
                <>
                  <Eye className="size-3.5" />
                  Analyse
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <Card className="flex min-h-48 items-center justify-center border-border/30">
          <CardContent className="text-center">
            <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <p className="text-sm text-muted-foreground">Fetching and analysing listing…</p>
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
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">
                  Their listing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Title</p>
                  <p className="text-sm leading-relaxed">{result.original.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {result.original.title.length} chars
                  </p>
                </div>

                {result.original.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                        Tags ({result.original.tags.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.original.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {result.original.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Description</p>
                      <p className="text-xs leading-relaxed text-muted-foreground line-clamp-4">
                        {result.original.description}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-primary">
                  Optimised version
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-medium text-muted-foreground">Title</p>
                    <button
                      onClick={() => copy(result.optimised.title, "opt-title")}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === "opt-title" ? (
                        <Check className="size-3 text-green-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed">{result.optimised.title}</p>
                  <p className={`mt-1 text-xs ${result.optimised.title.length <= 140 ? "text-green-500" : "text-destructive"}`}>
                    {result.optimised.title.length} / 140 chars
                  </p>
                </div>

                <Separator />
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Tags ({result.optimised.tags.length})
                    </p>
                    <button
                      onClick={() => copy(result.optimised.tags.join(", "), "opt-tags")}
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
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-medium text-muted-foreground">Description</p>
                    <button
                      onClick={() => copy(result.optimised.description, "opt-desc")}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === "opt-desc" ? (
                        <Check className="size-3 text-green-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed">{result.optimised.description}</p>
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
              Paste an Etsy listing URL above to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
