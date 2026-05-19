"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
      <span className="font-bold text-2xl mb-6">
        Sell<span className="text-primary">Wise</span>
      </span>
      <h1 className="text-lg font-bold text-foreground mb-2">Something went wrong</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        An unexpected error occurred. Try refreshing the page or head back to the dashboard.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Try again
        </button>
        <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
