import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "SellWise — AI Listing Optimiser for Online Sellers",
  description:
    "AI-powered SEO and listing optimiser for sellers on Etsy, Amazon, Shopify, and eBay. Better titles, tags, and descriptions in seconds.",
  openGraph: {
    title: "SellWise — AI Listing Optimiser for Online Sellers",
    description:
      "AI-powered SEO and listing optimiser for sellers on Etsy, Amazon, Shopify, and eBay. Better titles, tags, and descriptions in seconds.",
    url: "/",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "SellWise — AI Listing Optimiser" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SellWise — AI Listing Optimiser for Online Sellers",
    description:
      "AI-powered SEO and listing optimiser for sellers on Etsy, Amazon, Shopify, and eBay. Better titles, tags, and descriptions in seconds.",
    images: ["/api/og"],
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  if (code) redirect(`/auth/callback?code=${code}`);
  return <ComingSoon />;
}
