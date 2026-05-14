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
    default: "SellWise — AI Listing Optimiser for Marketplace Sellers",
    template: "%s | SellWise",
  },
  description:
    "Generate SEO-optimised titles, tags, and descriptions in seconds. Built for Etsy, Amazon, Shopify, and eBay sellers.",
  openGraph: {
    type: "website",
    siteName: "SellWise",
    title: "SellWise — AI Listing Optimiser for Marketplace Sellers",
    description:
      "Generate SEO-optimised titles, tags, and descriptions in seconds. Built for Etsy, Amazon, Shopify, and eBay sellers.",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "SellWise — AI Listing Optimiser for Marketplace Sellers",
    description:
      "Generate SEO-optimised titles, tags, and descriptions in seconds. Built for Etsy, Amazon, Shopify, and eBay sellers.",
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
