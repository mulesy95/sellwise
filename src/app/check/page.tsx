import type { Metadata } from "next";
import Link from "next/link";
import { CheckClient } from "./check-client";

export const metadata: Metadata = {
  title: "Free Shopify Listing Health Check — SellWise",
  description:
    "Paste any Shopify product URL and get an SEO score plus the top improvements in 10 seconds. Free, no account needed.",
};

export default function CheckPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 gap-12">
      <Link href="/" className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity">
        Sell<span className="text-primary">Wise</span>
      </Link>
      <CheckClient />
      <p className="text-xs text-muted-foreground/50">
        Shopify stores only. No data is stored.
      </p>
    </div>
  );
}
