import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  searchParams: Promise<{
    score?: string;
    platform?: string;
    label?: string;
    improvements?: string;
  }>;
}

function scoreColour(score: number) {
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const score = params.score ?? "0";
  const platform = params.platform ?? "etsy";
  const label = params.label ?? "Good";
  const improvements = params.improvements ?? "0";
  const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);

  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og/score?score=${score}&platform=${platform}&label=${label}&improvements=${improvements}`;

  return {
    title: `${platformLabel} listing scored ${score}/100 — SellWise`,
    description: `${label} — ${platformLabel} listing audit score. ${improvements} improvements identified. Score your own listing free at SellWise.`,
    openGraph: {
      title: `${platformLabel} listing scored ${score}/100`,
      description: `${label} — ${improvements} improvements identified. Try SellWise free.`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `Score: ${score}/100` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${platformLabel} listing scored ${score}/100`,
      description: `${label}. Score your own listing free at SellWise.`,
      images: [ogImageUrl],
    },
  };
}

export default async function ScorePage({ searchParams }: Props) {
  const params = await searchParams;
  const score = parseInt(params.score ?? "0");
  const platform = params.platform ?? "etsy";
  const label = params.label ?? "Good";
  const improvements = parseInt(params.improvements ?? "0");
  const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="text-2xl font-bold tracking-tight">
          Sell<span className="text-primary">Wise</span>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            A {platformLabel} listing was audited and scored
          </p>
          <div className={cn("text-8xl font-bold tabular-nums leading-none", scoreColour(score))}>
            {score}
          </div>
          <div className="text-base text-muted-foreground">out of 100</div>
          <p className="text-lg font-semibold">{label}</p>
          {improvements > 0 && (
            <p className="text-sm text-muted-foreground">
              {improvements} improvement{improvements !== 1 ? "s" : ""} identified
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-left space-y-1">
          <p className="text-sm font-medium">How does your listing score?</p>
          <p className="text-xs text-muted-foreground">
            Paste your title, tags, and description — get a score out of 100 with specific improvements. Free, no credit card needed.
          </p>
        </div>

        <div className="space-y-2">
          <Link href="/signup">
            <Button className="w-full">
              Score my listing free
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
          <Link href="/dashboard/audit" className="block">
            <Button variant="ghost" className="w-full text-muted-foreground text-sm">
              Already have an account? Sign in
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground/50">
          Audits listings for Etsy, Amazon, Shopify, and eBay.
        </p>
      </div>
    </div>
  );
}
