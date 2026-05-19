import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
      <span className="font-bold text-2xl mb-6">
        Sell<span className="text-primary">Wise</span>
      </span>
      <p className="text-7xl font-extrabold text-foreground/10 mb-4 leading-none">404</p>
      <h1 className="text-lg font-bold text-foreground mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        This page doesn&apos;t exist or has been moved.
      </p>
      <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
        Go to dashboard
      </Link>
    </div>
  );
}
