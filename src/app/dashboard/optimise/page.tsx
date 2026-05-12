"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, RotateCcw } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface OptimisedListing {
  title: string;
  tags: string[];
  description: string;
}

export default function OptimisePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimisedListing | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const form = e.currentTarget;
    const data = {
      productName: (form.elements.namedItem("productName") as HTMLInputElement)
        .value,
      materials: (form.elements.namedItem("materials") as HTMLInputElement)
        .value,
      style: (form.elements.namedItem("style") as HTMLInputElement).value,
      targetBuyer: (
        form.elements.namedItem("targetBuyer") as HTMLInputElement
      ).value,
      keywords: (form.elements.namedItem("keywords") as HTMLInputElement)
        .value,
    };

    try {
      const res = await fetch("/api/optimise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 402) {
          toast.error(err.error, {
            action: { label: "Upgrade", onClick: () => window.location.href = "/dashboard/settings" },
          });
          return;
        }
        throw new Error(err.error ?? "Something went wrong");
      }

      const json = await res.json();
      setResult(json);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to optimise");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles className="size-5 text-primary" />
          Listing Optimiser
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe your product and get an SEO-optimised title, 13 tags, and
          description instantly.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input form */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Product details</CardTitle>
            <CardDescription className="text-xs">
              The more detail you give, the better the results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="productName">
                  Product name / what it is{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="productName"
                  name="productName"
                  placeholder="e.g. Handmade ceramic coffee mug"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="materials">
                  Materials &amp; techniques
                </Label>
                <Input
                  id="materials"
                  name="materials"
                  placeholder="e.g. Stoneware clay, hand-thrown, food-safe glaze"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="style">Style &amp; aesthetic</Label>
                <Input
                  id="style"
                  name="style"
                  placeholder="e.g. Minimalist, rustic, boho, cottagecore"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="targetBuyer">Target buyer / occasion</Label>
                <Input
                  id="targetBuyer"
                  name="targetBuyer"
                  placeholder="e.g. Coffee lovers, housewarming gift, office decor"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="keywords">Keywords to include (optional)</Label>
                <Input
                  id="keywords"
                  name="keywords"
                  placeholder="e.g. unique mug, pottery gift, handmade gift"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <span className="mr-2 inline-block size-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Optimising…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    Optimise listing
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
                <Sparkles className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Your optimised listing will appear here.
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="flex min-h-64 items-center justify-center border-border/30">
              <CardContent className="text-center">
                <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                <p className="text-sm text-muted-foreground">
                  Generating your listing…
                </p>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Optimised listing</CardTitle>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setResult(null)}
                  title="Start over"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="title">
                  <TabsList className="w-full">
                    <TabsTrigger value="title" className="flex-1 text-xs">
                      Title
                    </TabsTrigger>
                    <TabsTrigger value="tags" className="flex-1 text-xs">
                      Tags
                    </TabsTrigger>
                    <TabsTrigger
                      value="description"
                      className="flex-1 text-xs"
                    >
                      Description
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="title" className="mt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex-1 text-sm leading-relaxed">
                        {result.title}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => copyToClipboard(result.title, "title")}
                      >
                        {copiedField === "title" ? (
                          <Check className="size-3.5 text-green-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{result.title.length} / 140 characters</span>
                      <span
                        className={
                          result.title.length <= 140
                            ? "text-green-500"
                            : "text-destructive"
                        }
                      >
                        {result.title.length <= 140 ? "✓ Good" : "Too long"}
                      </span>
                    </div>
                  </TabsContent>

                  <TabsContent value="tags" className="mt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {result.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          copyToClipboard(result.tags.join(", "), "tags")
                        }
                      >
                        {copiedField === "tags" ? (
                          <Check className="size-3.5 text-green-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                    <Separator />
                    <p className="text-xs text-muted-foreground">
                      {result.tags.length} / 13 tags
                    </p>
                  </TabsContent>

                  <TabsContent value="description" className="mt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">
                        {result.description}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          copyToClipboard(result.description, "description")
                        }
                      >
                        {copiedField === "description" ? (
                          <Check className="size-3.5 text-green-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                    <Separator />
                    <p className="text-xs text-muted-foreground">
                      {result.description.length} characters
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
