"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Sparkles, AlertCircle, Link2, PenLine, Share2, RotateCcw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/upgrade-modal";
import { PlatformSelector } from "@/components/platform-selector";
import { cn } from "@/lib/utils";
import { PLATFORMS, AUDIT_SECTIONS, PLATFORM_LABELS, detectPlatformFromUrl, PLATFORM_URL_EXAMPLES, type Platform } from "@/lib/platforms";
import type { Plan } from "@/lib/usage";

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
      hint: "Max 140 chars — paste your full title including commas and keywords",
    },
    {
      name: "tags",
      label: "Tags",
      type: "input",
      placeholder: "Comma-separated, e.g. ceramic mug, coffee lover gift",
      hint: "Paste all 13 tags separated by commas — Etsy allows exactly 13, each max 20 chars",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Your listing description",
      hint: "First 160 chars are shown in search — paste the full description",
    },
  ],
  amazon: [
    {
      name: "title",
      label: "Title",
      type: "input",
      placeholder: "Your Amazon product title",
      hint: "Max 200 chars — paste exactly as it appears in Seller Central",
    },
    {
      name: "bullets",
      label: "Bullet Points",
      type: "textarea",
      placeholder: "One bullet point per line",
      hint: "Paste each bullet on its own line — max 5 bullets, each up to 255 chars",
    },
    {
      name: "backendKeywords",
      label: "Backend Keywords",
      type: "input",
      placeholder: "Space-separated backend search terms",
      hint: "Paste the space-separated terms from your Seller Central backend — max 250 bytes",
    },
    {
      name: "description",
      label: "Description (optional)",
      type: "textarea",
      placeholder: "Your product description",
      hint: "Max 2000 chars — HTML tags can be included or omitted",
    },
  ],
  shopify: [
    {
      name: "metaTitle",
      label: "Meta Title",
      type: "input",
      placeholder: "Your page meta title (max 60 chars)",
      hint: "Found in your Shopify product SEO section — max 60 chars for Google display",
    },
    {
      name: "metaDescription",
      label: "Meta Description",
      type: "input",
      placeholder: "Your meta description (max 160 chars)",
      hint: "Found in your Shopify product SEO section — max 160 chars",
    },
    {
      name: "productCopy",
      label: "Product Description",
      type: "textarea",
      placeholder: "Your product page description",
      hint: "Paste the full product description from your Shopify admin — HTML tags can be included",
    },
  ],
  ebay: [
    {
      name: "title",
      label: "Title",
      type: "input",
      placeholder: "Your eBay listing title (max 80 chars)",
      hint: "Max 80 chars — paste exactly as it appears on your eBay listing",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Your item description",
      hint: "Paste the text content of your description — HTML tags can be omitted",
    },
  ],
  woocommerce: [
    {
      name: "metaTitle",
      label: "SEO Title",
      type: "input",
      placeholder: "Your Yoast/Rank Math SEO title (max 60 chars)",
      hint: "Found in the Yoast or Rank Math SEO panel below your product — max 60 chars",
    },
    {
      name: "metaDescription",
      label: "SEO Description",
      type: "input",
      placeholder: "Your meta description (max 160 chars)",
      hint: "Found in the Yoast or Rank Math SEO panel — max 160 chars",
    },
    {
      name: "productCopy",
      label: "Product Description",
      type: "textarea",
      placeholder: "Your product page description",
      hint: "Paste the full product description from your WooCommerce product editor",
    },
  ],
  wix: [
    {
      name: "metaTitle",
      label: "SEO Title",
      type: "input",
      placeholder: "Your Wix SEO title (max 60 chars)",
      hint: "Found in your Wix product SEO settings — max 60 chars",
    },
    {
      name: "metaDescription",
      label: "SEO Description",
      type: "input",
      placeholder: "Your meta description (max 160 chars)",
      hint: "Found in your Wix product SEO settings — max 160 chars",
    },
    {
      name: "productCopy",
      label: "Product Description",
      type: "textarea",
      placeholder: "Your product page description",
      hint: "Paste the full product description from your Wix store editor",
    },
  ],
  squarespace: [
    {
      name: "metaTitle",
      label: "SEO Title",
      type: "input",
      placeholder: "Your Squarespace SEO title (max 60 chars)",
      hint: "Found in your Squarespace product SEO tab — max 60 chars",
    },
    {
      name: "metaDescription",
      label: "SEO Description",
      type: "input",
      placeholder: "Your meta description (max 160 chars)",
      hint: "Found in your Squarespace product SEO tab — max 160 chars",
    },
    {
      name: "productCopy",
      label: "Product Description",
      type: "textarea",
      placeholder: "Your product page description",
      hint: "Paste the full description from your Squarespace product editor",
    },
  ],
  tiktok: [
    {
      name: "title",
      label: "Listing Title",
      type: "input",
      placeholder: "Your TikTok Shop product title (max 100 chars)",
      hint: "Max 100 chars — paste exactly as it appears in your TikTok Shop seller centre",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Your product description",
      hint: "Paste the full product description from your TikTok Shop listing",
    },
  ],
  social: [
    {
      name: "title",
      label: "Caption",
      type: "input",
      placeholder: "Your post caption / hook (max 125 chars)",
      hint: "Paste the first line of your caption — the hook before the 'more' cutoff",
    },
    {
      name: "tags",
      label: "Hashtags",
      type: "input",
      placeholder: "Your hashtags, comma or space separated",
      hint: "Paste all hashtags from your post — include the # or omit, both work",
    },
    {
      name: "description",
      label: "Post Copy",
      type: "textarea",
      placeholder: "Your full post copy",
      hint: "Paste the full post body — everything after the hook",
    },
  ],
};

const PLATFORM_DESCRIPTIONS: Record<Platform, string> = {
  etsy: "Score your Etsy listing 0–100 with a breakdown by title, tags, and description.",
  amazon: "Score your Amazon listing 0–100 across title, bullet points, and backend keywords.",
  shopify: "Score your Shopify product 0–100 across meta title, meta description, and product copy.",
  ebay: "Score your eBay listing 0–100 across title and item description.",
  woocommerce: "Score your WooCommerce product 0–100 across SEO title, meta description, and product copy.",
  wix: "Score your Wix product 0–100 across SEO title, meta description, and product copy.",
  squarespace: "Score your Squarespace product 0–100 across SEO title, meta description, and product copy.",
  tiktok: "Score your TikTok Shop listing 0–100 across title and product description.",
  social: "Score your social media post 0–100 across caption hook, hashtags, and post copy.",
};

function scoreColour(score: number, max: number) {
  const pct = (score / max) * 100;
  if (pct >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function overallColour(score: number) {
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function overallLabel(score: number) {
  if (score >= 70) return "Good";
  if (score >= 40) return "Needs work";
  return "Poor";
}

type InputMode = "url" | "manual";

export function AuditClient({ plan, preferredPlatforms }: { plan: Plan; preferredPlatforms: Platform[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("manual");
  const [platform, setPlatform] = useState<Platform>("shopify");
  const [urlValue, setUrlValue] = useState("");
  const [detectedPlatform, setDetectedPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urlHint, setUrlHint] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<Record<string, string> | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [prefillValues, setPrefillValues] = useState<Record<string, string>>({});
  const [formKey, setFormKey] = useState(0);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  const visiblePlatforms: Platform[] =
    showAllPlatforms || preferredPlatforms.length === 0
      ? PLATFORMS
      : preferredPlatforms;

  // Reset platform if current selection is hidden
  useEffect(() => {
    if (!visiblePlatforms.includes(platform)) {
      setPlatform(visiblePlatforms[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAllPlatforms]);

  useEffect(() => {
    // Read active platform from sessionStorage on mount (must be here to avoid SSR crash)
    const savedPlatform = sessionStorage.getItem("sw_active_platform") as Platform | null;
    if (savedPlatform && PLATFORMS.includes(savedPlatform)) setPlatform(savedPlatform);

    const raw = sessionStorage.getItem("audit:prefill");
    if (!raw) return;
    sessionStorage.removeItem("audit:prefill");
    try {
      const res = JSON.parse(raw);
      const p: Platform = res.platform ?? "etsy";
      const vals: Record<string, string> = {};
      if (p === "etsy") {
        if (res.title) vals.title = res.title;
        if (res.tags) vals.tags = Array.isArray(res.tags) ? res.tags.join(", ") : res.tags;
        if (res.description) vals.description = res.description;
      } else if (p === "amazon") {
        if (res.title) vals.title = res.title;
        if (res.bullets) vals.bullets = Array.isArray(res.bullets) ? res.bullets.join("\n") : res.bullets;
        if (res.backendKeywords) vals.backendKeywords = res.backendKeywords;
        if (res.description) vals.description = res.description;
      } else if (p === "shopify") {
        if (res.metaTitle) vals.metaTitle = res.metaTitle;
        if (res.metaDescription) vals.metaDescription = res.metaDescription;
        if (res.description) vals.productCopy = res.description;
      } else if (p === "ebay") {
        if (res.title) vals.title = res.title;
        if (res.description) vals.description = res.description;
      } else if (p === "woocommerce" || p === "wix" || p === "squarespace") {
        if (res.seoTitle) vals.metaTitle = res.seoTitle;
        if (res.seoDescription) vals.metaDescription = res.seoDescription;
        if (res.description) vals.productCopy = res.description;
      } else if (p === "tiktok") {
        if (res.title) vals.title = res.title;
        if (res.description) vals.description = res.description;
      } else if (p === "social") {
        if (res.caption) vals.title = res.caption;
        if (res.hashtags) vals.tags = Array.isArray(res.hashtags) ? res.hashtags.join(", ") : res.hashtags;
        if (res.postCopy) vals.description = res.postCopy;
      }
      setPlatform(p);
      setPrefillValues(vals);
      setMode("manual");
      setFormKey((k) => k + 1);
      toast.info("Listing pre-filled from optimiser");
    } catch {
      // ignore bad prefill data
    }
  }, []);

  function handlePlatformChange(p: Platform) {
    setPlatform(p);
    setResult(null);
  }

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setUrlValue(val);
    setResult(null);
    setError(null);
    const detected = detectPlatformFromUrl(val);
    if (detected === "etsy") {
      setDetectedPlatform(null);
      setUrlHint("Etsy URLs aren't supported. Switch to manual entry and paste your title, tags, and description.");
    } else if (detected === "amazon") {
      setDetectedPlatform(null);
      setUrlHint("Amazon URL auditing is coming soon. Switch to manual entry and paste your listing content.");
    } else if (detected === "ebay") {
      setDetectedPlatform(null);
      setUrlHint("eBay URL auditing is coming soon. Switch to manual entry and paste your listing content.");
    } else {
      setDetectedPlatform(detected);
      setUrlHint(val && !detected ? "URL mode supports Shopify stores. Use manual entry for Etsy, Amazon, and eBay." : null);
    }
  }

  async function runAudit(payload: Record<string, string>) {
    if (result) setPreviousScore(result.score);
    setLoading(true);
    setResult(null);
    setError(null);
    setLastPayload(payload);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        if (res.status === 402) { setUpgradeOpen(true); return; }
        throw new Error(err.error ?? "Something went wrong");
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run audit");
    } finally {
      setLoading(false);
    }
  }

  async function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!detectedPlatform) {
      toast.error("Paste a supported listing URL to continue");
      return;
    }
    await runAudit({ platform: detectedPlatform, url: urlValue });
  }

  async function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    if (!fields.some((f) => payload[f.name]?.trim())) {
      toast.error("Enter at least one field to audit");
      return;
    }
    await runAudit(payload);
  }

  function buildShareUrl() {
    if (!result) return "";
    const label = overallLabel(result.score);
    const improvements = (result.improvements as string[])?.length ?? 0;
    const url = new URL("/score", window.location.origin);
    url.searchParams.set("score", String(result.score));
    url.searchParams.set("platform", detectedPlatform ?? platform);
    url.searchParams.set("label", label);
    url.searchParams.set("improvements", String(improvements));
    if (previousScore !== null) url.searchParams.set("before", String(previousScore));
    return url.toString();
  }

  function buildShareCaption() {
    if (!result) return "";
    const score = result.score;
    const improvements = (result.improvements as string[])?.length ?? 0;
    const p = PLATFORM_LABELS[detectedPlatform ?? platform] ?? platform;
    const url = buildShareUrl();
    const fixLine = improvements > 0
      ? `${improvements} improvement${improvements !== 1 ? "s" : ""} to fix.`
      : "Looking solid.";

    if (previousScore !== null) {
      const delta = score - previousScore;
      const deltaStr = delta >= 0 ? `+${delta}` : String(delta);
      return `Just improved my ${p} listing from ${previousScore} → ${score}/100 on SellWise. ${deltaStr} points in one pass.\n\nAudit yours free: ${url}`;
    }

    if (score >= 70) {
      return `Just ran my ${p} listing through SellWise — scored ${score}/100. ${fixLine}\n\nScore yours free: ${url}`;
    } else if (score >= 40) {
      return `My ${p} listing scored ${score}/100 on SellWise. ${fixLine} More room to improve than I thought.\n\nAudit yours free: ${url}`;
    } else {
      return `My ${p} listing only scored ${score}/100 — turns out ${fixLine}\n\nSee what's dragging yours down: ${url}`;
    }
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(buildShareCaption());
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2000);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(buildShareUrl());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function handleReoptimise() {
    if (!lastPayload || !result) {
      router.push("/dashboard/optimise");
      return;
    }
    const p = detectedPlatform ?? platform;
    const parts = Object.entries(lastPayload)
      .filter(([k]) => k !== "platform" && k !== "url")
      .filter(([, v]) => (v as string).trim())
      .map(([k, v]) => `${k}: ${v}`);
    const existingContent = parts.join("\n\n");
    try {
      sessionStorage.setItem(
        "sw:optimise:prefill",
        JSON.stringify({ platform: p, existingContent })
      );
    } catch {
      // sessionStorage unavailable — fall back to URL with truncated content
      router.push(`/dashboard/optimise?platform=${p}&existingContent=${encodeURIComponent(existingContent.slice(0, 500))}`);
      return;
    }
    router.push("/dashboard/optimise");
  }

  const sections = AUDIT_SECTIONS[detectedPlatform ?? platform];

  return (
    <div className="space-y-6">
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason="feature" />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <BarChart3 className="size-5 text-primary" />
          Listing Audit
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {PLATFORM_DESCRIPTIONS[mode === "url" ? "shopify" : platform]}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="inline-flex rounded-lg border border-border/50 bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => { setMode("url"); setResult(null); setError(null); }}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "url" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Link2 className="size-3.5" />
          Shopify URL
        </button>
        <button
          type="button"
          onClick={() => { setMode("manual"); setResult(null); setError(null); }}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "manual" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <PenLine className="size-3.5" />
          Enter manually
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              {mode === "url" ? "Shopify product URL" : "Your listing"}
            </CardTitle>
            <CardDescription className="text-xs">
              {mode === "url"
                ? "Paste a Shopify product URL and we'll fetch and score it automatically."
                : "Paste your existing content — any combination of fields works. Supported for all platforms."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "url" ? (
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="listing-url">Listing URL</Label>
                  <Input
                    id="listing-url"
                    type="url"
                    placeholder={Object.values(PLATFORM_URL_EXAMPLES).join(" · ")}
                    value={urlValue}
                    onChange={handleUrlChange}
                    autoComplete="off"
                  />
                  {detectedPlatform && (
                    <Badge variant="outline" className="w-fit h-5 px-1.5 text-[10px] text-primary border-primary/30">
                      Detected: {detectedPlatform.charAt(0).toUpperCase() + detectedPlatform.slice(1)}
                    </Badge>
                  )}
                  {urlHint && (
                    <p className="text-[11px] text-muted-foreground">{urlHint}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading || !detectedPlatform}>
                  {loading ? (
                    <><Spinner size="sm" className="mr-2" />Auditing…</>
                  ) : (
                    <><Sparkles className="size-3.5" />Audit this listing</>
                  )}
                </Button>
              </form>
            ) : (
              <>
                <div className="mb-2">
                  <PlatformSelector value={platform} onChange={handlePlatformChange} visiblePlatforms={visiblePlatforms} />
                </div>
                {preferredPlatforms.length > 0 && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setShowAllPlatforms((v) => !v)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showAllPlatforms ? "Show my platforms only" : "Show all platforms"}
                    </button>
                  </div>
                )}
                <form key={formKey} onSubmit={handleManualSubmit} className="space-y-4">
                  {FORM_CONFIGS[platform].map((field) => (
                    <div key={field.name} className="space-y-1.5">
                      <Label htmlFor={field.name}>{field.label}</Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          id={field.name}
                          name={field.name}
                          rows={4}
                          placeholder={field.placeholder}
                          defaultValue={prefillValues[field.name] ?? ""}
                        />
                      ) : (
                        <Input id={field.name} name={field.name} placeholder={field.placeholder} defaultValue={prefillValues[field.name] ?? ""} />
                      )}
                      {field.hint && (
                        <p className="text-[11px] text-muted-foreground">{field.hint}</p>
                      )}
                    </div>
                  ))}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <><Spinner size="sm" className="mr-2" />Auditing…</>
                    ) : (
                      <><Sparkles className="size-3.5" />Run audit</>
                    )}
                  </Button>
                </form>
              </>
            )}
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
                <div className="flex items-center gap-2 shrink-0">
                  {lastPayload && (
                    <button
                      onClick={() => runAudit(lastPayload)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="size-3" />
                      Retry
                    </button>
                  )}
                  <button onClick={() => setError(null)} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
                </div>
              </CardContent>
            </Card>
          )}

          {!result && !loading && !error && (
            <Card className="flex min-h-64 items-center justify-center border-border/30 border-dashed">
              <CardContent className="text-center">
                <BarChart3 className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {mode === "url"
                    ? "Paste a Shopify URL and click Audit this listing."
                    : "Enter your listing content and click Run audit."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  You'll get a score out of 100 with specific improvements.
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="flex min-h-64 items-center justify-center border-border/30">
              <CardContent className="text-center">
                <Spinner size="lg" className="mx-auto mb-3" />
                <p className="text-sm text-muted-foreground" aria-live="polite">
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

              {/* Share your score */}
              <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShareOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Share2 className="size-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Share your score</p>
                      <p className="text-xs text-muted-foreground">Show your followers what you scored — and dare them to beat it.</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{shareOpen ? "▲" : "▼"}</span>
                </button>

                {shareOpen && (
                  <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-3">
                    {/* Before / after score display */}
                    {previousScore !== null && (
                      <div className="flex items-center justify-center gap-4 py-2">
                        <div className="text-center">
                          <div className={cn("text-4xl font-bold tabular-nums", overallColour(previousScore))}>
                            {previousScore}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">before</div>
                        </div>
                        <div className="text-2xl text-muted-foreground/50">→</div>
                        <div className="text-center">
                          <div className={cn("text-4xl font-bold tabular-nums", overallColour(result.score))}>
                            {result.score}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">after</div>
                        </div>
                        <span className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          result.score >= previousScore
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        )}>
                          {result.score >= previousScore ? "+" : ""}{result.score - previousScore} pts
                        </span>
                      </div>
                    )}

                    {/* Caption */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Caption</span>
                        <button
                          onClick={copyCaption}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {captionCopied
                            ? <><Check className="size-3 text-emerald-500" />Copied</>
                            : <><Copy className="size-3" />Copy</>}
                        </button>
                      </div>
                      <p className="whitespace-pre-wrap rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-foreground">
                        {buildShareCaption()}
                      </p>
                    </div>

                    {/* Link only */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Link only</span>
                        <button
                          onClick={copyLink}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {linkCopied
                            ? <><Check className="size-3 text-emerald-500" />Copied</>
                            : <><Copy className="size-3" />Copy</>}
                        </button>
                      </div>
                      <p className="truncate rounded-lg border border-border/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground font-mono">
                        {buildShareUrl()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Optimise CTA */}
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Ready to fix these issues?
                </p>
                {plan === "free" ? (
                  <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => setUpgradeOpen(true)}>
                    <Sparkles className="size-3" />
                    Optimise this listing
                  </Button>
                ) : (
                  <Button size="sm" className="h-7 text-xs gap-1.5" onClick={handleReoptimise}>
                    <Sparkles className="size-3" />
                    Optimise this listing
                  </Button>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => { setResult(null); setError(null); setLastPayload(null); setShareOpen(false); setPreviousScore(null); }}
              >
                <RotateCcw className="size-3.5" />
                Audit another listing
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
