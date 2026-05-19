"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function DashboardError({
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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="size-7 text-muted-foreground mb-3" />
      <h2 className="text-sm font-semibold text-foreground mb-1">Something went wrong</h2>
      <p className="text-xs text-muted-foreground mb-4 max-w-xs">
        An error occurred loading this page. Try again or refresh.
      </p>
      <button onClick={reset} className={buttonVariants({ size: "sm", variant: "outline" })}>
        Try again
      </button>
    </div>
  );
}
