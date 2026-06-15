import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  robots: { index: true },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold tracking-tight text-xl">
            Sell<span className="text-primary">Wise</span>
          </Link>
          <Link href="/signup" className={buttonVariants({ size: "sm" })}>
            Try free →
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
