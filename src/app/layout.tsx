import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "SellWise — AI That Knows Your Marketplace",
    template: "%s | SellWise",
  },
  description:
    "The AI listing writer that knows your marketplace. Applies Shopify, eBay, Amazon, and Etsy SEO rules automatically — and scores every listing 0–100.",
  openGraph: {
    type: "website",
    siteName: "SellWise",
    title: "SellWise — AI That Knows Your Marketplace",
    description:
      "The AI listing writer that knows your marketplace. Applies each platform's SEO rules automatically and scores every listing 0–100.",
    url: appUrl,
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "SellWise — AI Listing Optimiser" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SellWise — AI That Knows Your Marketplace",
    description:
      "The AI listing writer that knows your marketplace. Applies each platform's SEO rules automatically and scores every listing 0–100.",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark scroll-smooth`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
